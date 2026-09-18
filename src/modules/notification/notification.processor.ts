import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import admin from 'src/config/firebase.config';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { notificationId, userId, title, body, type, data } = job.data;
    
    this.logger.log(`Processing notification push job ${job.id} for user ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    if (!user.fcmToken) {
      this.logger.warn(`User ${userId} does not have an FCM token, skipping push notification`);
      return { status: 'skipped', reason: 'no_fcm_token' };
    }
 console.log("fcm", user.fcmToken)
    try {
      const response = await admin.messaging().send({
        token: user.fcmToken,
        notification: {
          title,
          body,
        },
        data: {
          type: type || '',
          notificationId: notificationId || '',
          ...(data || {}),
        },
      });

      this.logger.log(`Push notification sent successfully via FCM: ${response}`);
      return { status: 'success', fcmMessageId: response };
    } catch (error) {
      const isUnregistered =
        error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/invalid-argument' ||
        error.message?.includes('NotRegistered') ||
        error.message?.includes('not a valid FCM registration token');

      if (isUnregistered) {
        this.logger.warn(
          `FCM token for user ${userId} is invalid or unregistered (${error.message}). Clearing stale token from user record.`,
        );

        try {
          await this.prisma.user.update({
            where: { id: userId },
            data: { fcmToken: null },
          });
        } catch (dbError) {
          this.logger.error(`Failed to clear stale FCM token for user ${userId}: ${dbError.message}`);
        }

        return { status: 'failed', reason: 'token_unregistered', error: error.message };
      }

      this.logger.error(`FCM sending failed for user ${userId}: ${error.message}`);
      throw error; // Throw for transient/network errors to trigger BullMQ retry
    }
  }
}
