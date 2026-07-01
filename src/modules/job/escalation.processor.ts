import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TraderMatchingService } from '../trader-matching/trader-matching.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationService } from '../notification/notification.service';
import { RedisService } from 'src/redis/redis.service';

@Processor('escalation')
export class EscalationProcessor extends WorkerHost {
  private readonly logger = new Logger(EscalationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingService: TraderMatchingService,
    private notificationService: NotificationService,
    private redisService: RedisService,
    @InjectQueue('escalation') private readonly escalationQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { jobId, expectedVersion } = job.data;

    this.logger.log(`Processing delayed escalation check for job ${jobId}, expectedVersion: ${expectedVersion}`);

    const dbJob = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        quotesReceived: true,
        currentRadiusKm: true,
        escalationVersion: true,
        lastEscalatedAt: true,
        distributionStatus: true,
      },
    });

    if (!dbJob) {
      this.logger.log(`Job ${jobId} not found, stopping escalation chain`);
      return { status: 'skipped', reason: 'job_not_found' };
    }

    if (dbJob.distributionStatus !== 'AUTO') {
      this.logger.log(
        `Job ${jobId} distribution stopped. Current status: ${dbJob.distributionStatus}`,
      );

      return {
        status: 'skipped',
        reason: `distribution_${dbJob.distributionStatus.toLowerCase()}`,
      };
    }

    // Stop if job is already assigned, completed, closed or cancelled
    if (dbJob.status !== 'POSTED' && dbJob.status !== 'QUOTE_RECEIVED') {
      this.logger.log(`Job ${jobId} status is ${dbJob.status}, stopping escalation chain`);
      return { status: 'skipped', reason: 'job_inactive' };
    }

    // Stop if quote limit reached (3 quotes)
    if (dbJob.quotesReceived >= 3) {
      this.logger.log(`Job ${jobId} has ${dbJob.quotesReceived} quotes, stopping escalation chain`);
      return { status: 'skipped', reason: 'quote_limit_reached' };
    }

    // Stop if version check fails (optimistic lock)
    if (dbJob.escalationVersion !== expectedVersion) {
      this.logger.log(`Job ${jobId} version mismatch (DB: ${dbJob.escalationVersion}, Job: ${expectedVersion}). Skipping.`);
      return { status: 'skipped', reason: 'version_mismatch' };
    }

    // Stop if radius already reaches max cap (100km)
    if (dbJob.currentRadiusKm >= 100) {
      this.logger.log(`Job ${jobId} current radius is already ${dbJob.currentRadiusKm}km, stopping escalation`);
      return { status: 'skipped', reason: 'max_radius_reached' };
    }

    // Escalate: calculate new radius (+10km, max 100)
    const newRadius = Math.min(100, dbJob.currentRadiusKm + 10);
    const nextVersion = dbJob.escalationVersion + 1;

    try {
      // Update job radius and escalation metadata
      const updated = await this.prisma.job.updateMany({
        where: {
          id: jobId,
          escalationVersion: dbJob.escalationVersion,
        },
        data: {
          currentRadiusKm: newRadius,
          lastEscalatedAt: new Date(),
          escalationVersion: nextVersion,
        },
      });

      if (updated.count === 0) {
        this.logger.warn(`Job ${jobId} update failed (concurrency race), skipping escalation`);
        return { status: 'skipped', reason: 'concurrency_failure' };
      }

      // Log the escalation
      await this.prisma.jobEscalationLog.create({
        data: {
          jobId: dbJob.id,
          previousRadius: dbJob.currentRadiusKm,
          newRadius,
        },
      });

      this.logger.log(`Job ${jobId} escalated successfully from ${dbJob.currentRadiusKm}km -> ${newRadius}km`);

      // Trigger matching for the new expanded radius
      await this.matchingService.matchAndSendJob(dbJob.id);
      /*
      |--------------------------------------------------------------------------
      | MOVE TO MANUAL REVIEW AFTER 3 ESCALATIONS WITH NO QUOTES
      |--------------------------------------------------------------------------
      */
      const escalationCount = nextVersion;

      if (
        escalationCount >= 5 &&
        dbJob.quotesReceived === 0
      ) {
        await this.prisma.job.update({
          where: {
            id: jobId,
          },
          data: {
            distributionStatus: 'MANUAL_REVIEW',
          },
        });

        await this.redisService.deleteByPattern(
          'admin:manual-review-jobs:*',
        );
        await this.redisService.del(`admin:job:${jobId}`);
        // Notify all admins
        const admins = await this.prisma.user.findMany({
          where: {
            role: 'ADMIN',
          },
          select: {
            id: true,
          },
        });

        await Promise.all(
          admins.map((admin) =>
            this.notificationService.createNotification(
              admin.id,
              'Job Requires Manual Review',
              `Job #${jobId} has been moved to manual review after ${escalationCount} escalation attempts with no quotes received.`,
              'JOB_MANUAL_REVIEW',
              {
                jobId,
                escalationCount,
              },
            ),
          ),
        );

        this.logger.warn(
          `Job ${jobId} moved to MANUAL_REVIEW after ${escalationCount} escalations`,
        );

        return {
          status: 'manual_review',
          radius: newRadius,
        };
      }

      // Queue the next escalation delayed job if radius still under 100km
      if (newRadius < 100) {
        await this.escalationQueue.add(
          'escalate-job',
          { jobId: dbJob.id, expectedVersion: nextVersion },
          { delay: 20 * 60 * 1000 }
        );
        this.logger.log(`Queued next escalation check for job ${jobId} in 20 minutes (expected version: ${nextVersion})`);
      }

      return { status: 'success', newRadius };
    } catch (error) {
      this.logger.error(`Failed to execute escalation for job ${jobId}: ${error.message}`);
      throw error;
    }
  }
}
