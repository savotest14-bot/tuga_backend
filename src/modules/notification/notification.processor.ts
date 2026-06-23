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
      this.logger.error(`FCM sending failed for user ${userId}: ${error.message}`);
      throw error; // Throw to trigger BullMQ retry
    }
  }
}
