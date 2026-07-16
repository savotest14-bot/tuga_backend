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
    | JOB CHAT
    |--------------------------------------------------------------------------
    */
    if (jobId) {
      // Same job conversation already exists
      const existingJob = await this.prisma.conversation.findFirst({
        where: {
          customerId,
          traderId,
          type: 'JOB',
          jobId,
        },
        include: {
          customer: true,
          trader: true,
          job: true,
        },
      });

      if (existingJob) {
        return existingJob;
      }

      // Existing direct conversation
      const directConversation = await this.prisma.conversation.findFirst({
        where: {
          customerId,
          traderId,
          type: 'DIRECT',
        },
      });

      // First job -> convert DIRECT to JOB
      if (directConversation) {
        return this.prisma.conversation.update({
          where: {
            id: directConversation.id,
          },
          data: {
            type: 'JOB',
            jobId,
          },
          include: {
            customer: true,
            trader: true,
            job: true,
          },
        });
      }

      // No direct and no same job -> create new JOB conversation
      return this.prisma.conversation.create({
        data: {
          customerId,
          traderId,
          jobId,
          type: 'JOB',
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
    | DIRECT CHAT
    |--------------------------------------------------------------------------
    */

    const existingDirect = await this.prisma.conversation.findFirst({
      where: {
        customerId,
        traderId,
        type: 'DIRECT',
      },
      include: {
        customer: true,
        trader: true,
        job: true,
      },
    });

    if (existingDirect) {
      return existingDirect;
    }

    return this.prisma.conversation.create({
      data: {
        customerId,
        traderId,
        type: 'DIRECT',
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