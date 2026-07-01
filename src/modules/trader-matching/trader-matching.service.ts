import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class TraderMatchingService {
  private readonly logger = new Logger(TraderMatchingService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private redisService: RedisService,
  ) { }

  async matchAndSendJob(jobId: string) {
    /*
    |--------------------------------------------------------------------------
    | FIND JOB
    |--------------------------------------------------------------------------
    */

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      this.logger.warn(`Job ${jobId} not found, skipping match`);
      return [];
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE JOB COORDINATES
    |--------------------------------------------------------------------------
    */

    if (!job.latitude || !job.longitude) {
      this.logger.warn(`Job ${jobId} missing coordinates, cannot match traders`);
      return [];
    }

    /*
    |--------------------------------------------------------------------------
    | STOP IF QUOTE LIMIT REACHED
    |--------------------------------------------------------------------------
    */

    if (job.quotesReceived >= 3) {
      this.logger.log(`Job ${jobId} already has ${job.quotesReceived} quotes, skipping match`);
      return [];
    }

    /*
    |--------------------------------------------------------------------------
    | CACHED GLOBAL AVG RATING
    |--------------------------------------------------------------------------
    */

    const cacheKey = 'global:average_rating';
    let globalAverageRating = await this.redisService.get<number>(cacheKey);
    if (globalAverageRating === null) {
      const metrics = await this.prisma.traderMetrics.aggregate({
        _avg: {
          averageRating: true,
        },
      });
      globalAverageRating = metrics._avg.averageRating || 0.0;
      await this.redisService.set(cacheKey, globalAverageRating, 3600); // 1 hour cache
    }

    /*
    |--------------------------------------------------------------------------
    | FIND & SCORE TRADERS VIA POSTGIS RAW SQL
    |--------------------------------------------------------------------------
    | Pushes distance calculations, category filters, response rates, and 
    | Bayesian rating calculations directly to the PostgreSQL engine.
    | Excludes low response rate (<30%) traders if they have >= 8 total matches.
    |--------------------------------------------------------------------------
    */

    const conditions: Prisma.Sql[] = [
      Prisma.sql`u.role = 'TRADER'`,
      Prisma.sql`u.status = 'ACTIVE'`,
      Prisma.sql`tp."isVisible" = true`,
      Prisma.sql`tp."verificationStatus" = 'APPROVED'`,
      Prisma.sql`tp."subscriptionStatus" IN ('TRIAL', 'ACTIVE')`,
      Prisma.sql`u.latitude IS NOT NULL`,
      Prisma.sql`u.longitude IS NOT NULL`,
      Prisma.sql`u.location IS NOT NULL`,
      Prisma.sql`${job.categoryId} = ANY(tp."tradeCategories")`,
      Prisma.sql`${job.skillServiceId} = ANY(tp."skillsServices")`,
      // ST_DWithin uses spatial index (GIST) on u.location
      Prisma.sql`ST_DWithin(u.location, ST_SetSRID(ST_MakePoint(${job.longitude}, ${job.latitude}), 4326)::geography, ${job.currentRadiusKm * 1000}::double precision)`,
      // Temporarily exclude low response rate traders (under 30%) who are not new (totalMatchedJobs >= 8)
      Prisma.sql`NOT (COALESCE(tm."totalMatchedJobs", 0) >= 8 AND COALESCE(tm."responseRate", 0) < 0.3)`
    ];

    if (job.subCategoryId) {
      conditions.push(Prisma.sql`${job.subCategoryId} = ANY(tp."subCategories")`);
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

    const scoredTraders = await this.prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT 
          u.id AS "traderId",
          u.email,
          (ST_Distance(u.location, ST_SetSRID(ST_MakePoint(${job.longitude}, ${job.latitude}), 4326)::geography) / 1000) AS "distanceKm",
          GREATEST(0.0, LEAST(1.0, (
            -- Proximity score (weight 0.30)
            0.30 * GREATEST(0.0, 1 - (ST_Distance(u.location, ST_SetSRID(ST_MakePoint(${job.longitude}, ${job.latitude}), 4326)::geography) / 1000 / ${job.currentRadiusKm})) +
            
            -- Bayesian rating (weight 0.25)
            0.25 * COALESCE(
              ((COALESCE(tm."totalReviews", 0)::double precision / (COALESCE(tm."totalReviews", 0) + 10)::double precision) * COALESCE(tm."averageRating", 0) +
              (10::double precision / (COALESCE(tm."totalReviews", 0) + 10)::double precision) * ${globalAverageRating}) / 5.0, 0.0
            ) +
            
            -- Response rate (weight 0.20)
            0.20 * COALESCE(tm."responseRate", 0.0) +
            
            -- Fairness score (weight 0.15)
            0.15 * (1.0 - LEAST(1.0, COALESCE(tm."recentLeads", 0)::double precision / 50.0)) +
            
            -- New trader boost (weight 0.15, applies if totalMatchedJobs < 8)
            CASE WHEN COALESCE(tm."totalMatchedJobs", 0) < 8 THEN 0.15 ELSE 0.0 END
            -- Small random factor to add variability
            + (RANDOM() * 0.03) 
          ))) AS "finalScore"
        FROM "User" u
        INNER JOIN "TraderProfile" tp ON tp."userId" = u.id
        LEFT JOIN "TraderMetrics" tm ON tm."traderId" = u.id
        LEFT JOIN "Subscription" s
        ON s."traderProfileId" = tp.id
        LEFT JOIN "SubscriptionPlan" sp
        ON sp.id = s."planId"
        ${whereClause}
        ORDER BY
        COALESCE(sp."featuredAtTop", false) DESC,

        CASE
          WHEN sp."exposureLevel" = 'MAXIMUM' THEN 3
          WHEN sp."exposureLevel" = 'INCREASED' THEN 2
          ELSE 1
        END DESC,

       "finalScore" DESC,

        COALESCE(tm."totalReviews", 0) DESC,

        COALESCE(tm."responseRate", 0) DESC,

       "distanceKm" ASC
        LIMIT 5
        `
      );

    if (scoredTraders.length === 0) {
      this.logger.log(`No matching traders found within ${job.currentRadiusKm}km for job ${jobId}`);
      return [];
    }

    /*
    |--------------------------------------------------------------------------
    | SAVE MATCHES IN A SINGLE BATCH TRANSACTION
    |--------------------------------------------------------------------------
    */

    const transactionOperations: Prisma.PrismaPromise<any>[] = [];

    const newMatchedTraders: any[] = [];

    for (const item of scoredTraders) {

      const existingMatch =
        await this.prisma.jobTraderMatch.findUnique({
          where: {
            jobId_traderId: {
              jobId: job.id,
              traderId: item.traderId,
            },
          },
        });
      /*
      |--------------------------------------------------------------------------
      | EXISTING MATCH
      |--------------------------------------------------------------------------
      */
      if (existingMatch) {

        transactionOperations.push(
          this.prisma.jobTraderMatch.update({
            where: {
              jobId_traderId: {
                jobId: job.id,
                traderId: item.traderId,
              },
            },

            data: {
              distanceKm: item.distanceKm,
              score: item.finalScore,
            },
          })
        );
      } else {
        /*
        |--------------------------------------------------------------------------
        | NEW MATCH
        |--------------------------------------------------------------------------
        */
        transactionOperations.push(
          this.prisma.jobTraderMatch.create({
            data: {
              jobId: job.id,
              traderId: item.traderId,
              radiusKm: job.currentRadiusKm,
              distanceKm: item.distanceKm,
              score: item.finalScore,
            },
          })
        );
        /*
        |--------------------------------------------------------------------------
        | METRICS
        |--------------------------------------------------------------------------
        */
        transactionOperations.push(
          this.prisma.traderMetrics.upsert({
            where: {
              traderId: item.traderId,
            },
            create: {
              traderId: item.traderId,
              invitesCount: 1,
              recentLeads: 1,
              totalMatchedJobs: 1,
              responseRate: 0,
              averageRating: 0,
              totalReviews: 0,
              completedJobs: 0,
            },

            update: {
              invitesCount: {
                increment: 1,
              },

              recentLeads: {
                increment: 1,
              },

              totalMatchedJobs: {
                increment: 1,
              },
            },
          })
        );
        /*
        |--------------------------------------------------------------------------
        | STORE FOR NOTIFICATION
        |--------------------------------------------------------------------------
        */
        newMatchedTraders.push(item);
      }
      await this.redisService.deleteByPattern(
        `trader:matched-jobs:${item.traderId}:*`,
      );
      await this.redisService.del(`admin:job:${jobId}`);
    }

    await this.prisma.$transaction(
      transactionOperations,
    );
    /*
    |--------------------------------------------------------------------------
    | SEND NOTIFICATIONS (outside transaction)
    |--------------------------------------------------------------------------
    */
    for (const item of newMatchedTraders) {

      await this.notificationService
        .createNotification(
          item.traderId,

          'New Job Available',

          `${job.title} job is available near your area.`,

          'NEW_JOB',

          {
            jobId: job.id,

            title: job.title,

            budgetRange:
              job.budgetRange || '',

            distanceKm:
              item.distanceKm.toFixed(2),

            score:
              item.finalScore.toFixed(2),
          },
        )
        .catch((error) => {

          this.logger.error(
            `Notification failed for trader ${item.traderId}: ${error.message}`,
          );

        });
    }

    return scoredTraders;
  }
  /*
  |--------------------------------------------------------------------------
  | LEGACY DISTANCE CALCULATORS (Kept for compatibility)
  |--------------------------------------------------------------------------
  */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
      Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number) {
    return (value * Math.PI) / 180;
  }
}