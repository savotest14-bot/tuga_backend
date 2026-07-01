import {
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import { PrismaService }
    from 'src/prisma/prisma.service';

import {
    ContentType,
} from '@prisma/client';
import { ModerationService } from '../moderation/moderation.service';

@Injectable()
export class ChatService {

    constructor(
        private prisma: PrismaService,
        private readonly moderationService: ModerationService,
    ) { }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE ACCESS
    |--------------------------------------------------------------------------
    */

    async validateConversationAccess(
        conversationId: string,
        userId: string,
    ) {

        const conversation =
            await this.prisma.conversation.findFirst({
                where: {
                    id: conversationId,

                    OR: [
                        {
                            customerId: userId,
                        },
                        {
                            traderId: userId,
                        },
                    ],
                },
            });

        if (!conversation) {

            throw new UnauthorizedException(
                'Conversation access denied',
            );
        }

        return conversation;
    }

    /*
    |--------------------------------------------------------------------------
    | SEND MESSAGE
    |--------------------------------------------------------------------------
    */

    async sendMessage(body:
        { conversationId: string; senderId: string; message?: string; attachments?: string[]; }) {
        const conversation = await this.validateConversationAccess(body.conversationId, body.senderId,);
        const message = await this.prisma.message.create({
            data: { conversationId: body.conversationId, senderId: body.senderId, message: body.message, attachments: body.attachments || [], },
            include: { sender: { select: { id: true, fullName: true, profileImage: true, isOnline: true, }, }, },
        });
        await this.prisma.conversation.update({
            where: { id: body.conversationId, },
            data: { updatedAt: new Date(), },
        });
        if (body.message?.trim()) {
            await this.moderationService.scanContent(
                body.senderId,
                body.message,
                ContentType.MESSAGE,
                message.id,
            );
        }
        return { ...message, receiverId: conversation.customerId === body.senderId ? conversation.traderId : conversation.customerId, };
    }
    /*
    |--------------------------------------------------------------------------
    | GET MESSAGES
    |--------------------------------------------------------------------------
    */
    async getConversationMessages(
        conversationId: string,
        userId: string,
    ) {

        await this.validateConversationAccess(
            conversationId,
            userId,
        );

        return this.prisma.message.findMany({
            where: {
                conversationId,
            },

            include: {
                sender: {
                    select: {
                        id: true,
                        fullName: true,
                        profileImage: true,
                        isOnline: true,
                    },
                },
            },

            orderBy: {
                createdAt: 'asc',
            },
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ONLINE
    |--------------------------------------------------------------------------
    */

    async setUserOnline(userId: string) {

        // console.log('SET ONLINE =>', userId);

        const user = await this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                isOnline: true,
            },
        });

        // console.log('ONLINE UPDATED =>', user);

        return user;
    }

    /*
    |--------------------------------------------------------------------------
    | OFFLINE
    |--------------------------------------------------------------------------
    */

    async setUserOffline(userId: string) {

        // console.log('SET OFFLINE =>', userId);

        const user = await this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                isOnline: false,
                lastSeen: new Date(),
            },
        });

        // console.log('OFFLINE UPDATED =>', user);

        return user;
    }

    /*
    |--------------------------------------------------------------------------
    | MARK AS READ
    |--------------------------------------------------------------------------
    */

    async markMessagesAsRead(
        conversationId: string,
        userId: string,
    ) {

        return this.prisma.message.updateMany({
            where: {
                conversationId,

                senderId: {
                    not: userId,
                },

                isRead: false,
            },

            data: {
                isRead: true,
            },
        });
    }

    async getConversingUsers(userId: string): Promise<string[]> {
        const conversations = await this.prisma.conversation.findMany({
            where: {
                OR: [
                    { customerId: userId },
                    { traderId: userId },
                ],
            },
            select: {
                customerId: true,
                traderId: true,
            },
        });

        const userIds = new Set<string>();
        for (const conn of conversations) {
            if (conn.customerId !== userId) userIds.add(conn.customerId);
            if (conn.traderId !== userId) userIds.add(conn.traderId);
        }
        return Array.from(userIds);
    }
}