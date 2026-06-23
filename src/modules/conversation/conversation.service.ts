import {
  Injectable,
} from '@nestjs/common';

import { PrismaService }
  from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class ConversationService {

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) { }

  /*
  |--------------------------------------------------------------------------
  | CREATE CONVERSATION
  |--------------------------------------------------------------------------
  */

  async createConversation(
    customerId: string,
    traderId: string,
    jobId?: string,
  ) {

    /*
    |--------------------------------------------------------------------------
    | CHECK EXISTING CONVERSATION
    |--------------------------------------------------------------------------
    */

    const existing =
      await this.prisma.conversation.findFirst({
        where: {
          customerId,
          traderId,

          jobId:
            jobId || null,
        },
      });

    if (existing) {
      return existing;
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE CONVERSATION
    |--------------------------------------------------------------------------
    */

    await Promise.all([
      this.redisService.del(
        `chat:conversations:${customerId}`,
      ),
      this.redisService.del(
        `chat:conversations:${traderId}`,
      ),
    ]);

    return this.prisma.conversation.create({
      data: {

        customerId,

        traderId,

        jobId,

        type: jobId
          ? 'JOB'
          : 'DIRECT',
      },

      include: {

        customer: true,

        trader: true,

        job: true,
      },
    });
  }

  /*
  |--------------------------------------------------------------------------
  | GET MY CONVERSATIONS
  |--------------------------------------------------------------------------
  */

  async getMyConversations(
    userId: string,
  ) {
    const cacheKey = `chat:conversations:${userId}`;

    const cached =
      await this.redisService.get(cacheKey);

    if (cached) {
      return cached;
    }
    const conversations =
      await this.prisma.conversation.findMany({
        where: {
          OR: [
            {
              customerId: userId,
            },
            {
              traderId: userId,
            },
          ],
        },

        include: {

          /*
          |--------------------------------------------------------------------------
          | CUSTOMER
          |--------------------------------------------------------------------------
          */

          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              profileImage: true,
            },
          },

          /*
          |--------------------------------------------------------------------------
          | TRADER
          |--------------------------------------------------------------------------
          */

          trader: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              profileImage: true,
            },
          },

          /*
          |--------------------------------------------------------------------------
          | LAST MESSAGE
          |--------------------------------------------------------------------------
          */

          messages: {
            take: 1,

            orderBy: {
              createdAt: 'desc',
            },

            include: {
              sender: {
                select: {
                  id: true,
                  fullName: true,
                  profileImage: true,
                },
              },
            },
          },

          /*
          |--------------------------------------------------------------------------
          | UNREAD COUNT
          |--------------------------------------------------------------------------
          */

          _count: {
            select: {
              messages: {
                where: {

                  isRead: false,

                  senderId: {
                    not: userId,
                  },
                },
              },
            },
          },
        },

        orderBy: {
          updatedAt: 'desc',
        },
      });

    const result = conversations.map(
      (conversation) => ({
        ...conversation,
        unreadCount:
          conversation._count.messages,
      }),
    );

    await this.redisService.set(
      cacheKey,
      result,
      30, // cache for 30 seconds
    );

    return result;
  }
}