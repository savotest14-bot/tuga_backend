import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { GetNotificationsDto } from './dto/get-my-notification.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private redisService: RedisService,
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
  ) { }

  async createNotification(
    userId: string,
    title: string,
    body: string,
    type?: string,
    data?: any,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fcmToken: true,
      },
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found, cannot create notification`);
      return;
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type,
        data,
      },
    });
    if (user.fcmToken) {
      try {
        await this.notificationQueue.add(
          'send-push',
          {
            notificationId: notification.id,
            userId,
            title,
            body,
            type,
            data,
          },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000, // 2s, 4s, 8s
            },
            removeOnComplete: true,
            removeOnFail: false,
          },
        );
      } catch (error) {
        this.logger.error(`Failed to enqueue push notification job for user ${userId}: ${error.message}`);
      }
    }

    await this.redisService.deleteByPattern(
      `notifications:${userId}:*`,
    );

    return notification;
  }

  async getMyNotifications(
    userId: string,
    query: GetNotificationsDto,
  ) {

    const {
      page = 1,
      limit = 20,
    } = query;

    const skip =
      (page - 1) * limit;

    const cacheKey =
      `notifications:${userId}:${page}:${limit}`;

    const cached =
      await this.redisService.get(cacheKey);
    if (cached) {
      return cached;
    }
    const [notifications, total] =
      await Promise.all([

        this.prisma.notification.findMany({
          where: {
            userId,
          },

          orderBy: {
            createdAt: 'desc',
          },

          skip,
          take: limit,
        }),

        this.prisma.notification.count({
          where: {
            userId,
          },
        }),
      ]);

    const unreadCount =
      await this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

    const result = {
      message:
        'Notifications fetched successfully',

      data: notifications,

      unreadCount,

      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(
          total / limit,
        ),
      },
    };

    await this.redisService.set(
      cacheKey,
      result,
      300,
    );

    return result;
  }

  async markAllAsRead(
    userId: string,
  ) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },

      data: {
        isRead: true,
      },
    });

    await this.redisService.deleteByPattern(
      `notifications:${userId}:*`,
    );

    return {
      message:
        'All notifications marked as read',
    };
  }
  
}
