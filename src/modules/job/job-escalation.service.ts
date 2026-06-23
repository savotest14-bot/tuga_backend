import { Injectable, Logger } from '@nestjs/common';

import { Cron } from '@nestjs/schedule';

import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class JobEscalationService {

  private readonly logger = new Logger(JobEscalationService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private redisService: RedisService,
  ) { }

  /*
  |--------------------------------------------------------------------------
  | AUTO CLOSE JOBS - DAILY AT 2 AM
  |--------------------------------------------------------------------------
  */

  @Cron('0 2 * * *')
  async autoCloseJobs() {

    this.logger.log(
      'Auto-close jobs cron started',
    );

    try {

      const jobs =
        await this.prisma.job.findMany({

          where: {

            expiresAt: {
              lte: new Date(),
            },

            status: {
              notIn: [
                'COMPLETED',
                'ARCHIVED',
                'CLOSED',
                'CANCELLED',
                'IN_PROGRESS',
              ],
            },
          },

          select: {
            id: true,
            title: true,
            customerId: true,
          },
        });

      if (!jobs.length) {

        this.logger.log(
          'No expired jobs found',
        );

        return;
      }

      await this.prisma.job.updateMany({

        where: {
          id: {
            in: jobs.map(
              job => job.id,
            ),
          },
        },

        data: {
          status: 'CLOSED',
        },
      });

      /*
      |--------------------------------------------------------------------------
      | NOTIFICATIONS
      |--------------------------------------------------------------------------
      */

      await Promise.all(

        jobs.map(job =>
          this.notificationService.createNotification(
            job.customerId,
            'Job Closed',
            `Your job "${job.title}" has been automatically closed because it expired.`,
            'JOB_AUTO_CLOSED',
            {
              jobId: job.id,
            },
          ),
        ),
      );

      /*
      |--------------------------------------------------------------------------
      | CLEAR CACHE
      |--------------------------------------------------------------------------
      */

      for (const job of jobs) {

        await this.redisService.deleteByPattern(
          `customer:jobs:${job.customerId}:*`,
        );
      }

      await this.redisService.deleteByPattern(
        'admin:jobs:*',
      );

      await this.redisService.deleteByPattern(
        'admin:manual-review-jobs:*',
      );

      this.logger.log(
        `Auto-closed ${jobs.length} expired jobs`,
      );

    } catch (error) {

      this.logger.error(
        `Auto-close cron failed: ${error.message}`,
        error.stack,
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | RESET FAIRNESS SCORE - WEEKLY ON SUNDAY 3 AM
  |--------------------------------------------------------------------------
  */

  @Cron('0 3 * * 0')
  async resetWeeklyFairnessScores() {

    this.logger.log(
      'Weekly fairness score reset started',
    );

    try {

      const reset =
        await this.prisma.traderMetrics.updateMany({

          data: {
            recentLeads: 0,
            recentLeadsResetAt: new Date(),
          },
        });

      this.logger.log(
        `Reset fairness scores for ${reset.count} traders`,
      );

    } catch (error) {

      this.logger.error(
        `Fairness reset cron failed: ${error.message}`,
        error.stack,
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CLEANUP EXPIRED REVIEWS - DAILY AT 1 AM
  |--------------------------------------------------------------------------
  */

  @Cron('0 1 * * *')
  async cleanupExpiredReviews() {
    this.logger.log('Review cleanup cron started');

    try {
      const archived = await this.prisma.review.updateMany({
        where: {
          // expiresAt: {
          //   lte: new Date(),
          // },

          status: 'APPROVED',
        },

        data: {
          status: 'ARCHIVED',
        },
      });

      this.logger.log(`Archived ${archived.count} expired reviews`);

    } catch (error) {
      this.logger.error(
        `Review cleanup cron failed: ${error.message}`,
        error.stack,
      );
    }
  }
}

