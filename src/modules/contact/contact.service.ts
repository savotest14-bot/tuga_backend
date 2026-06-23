import { Injectable, BadRequestException } from '@nestjs/common';


import { CreateContactDto } from './dto/create-contact.dto';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { NotificationService } from '../notification/notification.service';
import { ContactStatus, ContactSubject } from '@prisma/client';
import { GetContactsQueryDto } from './dto/get-contacts.dto';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class ContactService {
    constructor(
        private prisma: PrismaService,
        private redisService: RedisService, // Optional
        private notificationService: NotificationService,
    ) { }

    async createContactSubmission(
        userId: string | null,
        dto: CreateContactDto,
        attachments: Express.Multer.File[] = [],
    ) {
        const submission = await this.prisma.$transaction(async (tx) => {
            // Create main submission
            const contact = await tx.contactSubmission.create({
                data: {
                    userId,
                    name: dto.name,
                    email: dto.email,
                    subject: dto.subject,
                    message: dto.message,
                    status: 'PENDING',
                },
            });

            // Handle attachments
            if (attachments.length > 0) {
                const attachmentData = attachments.map((file) => ({
                    contactSubmissionId: contact.id,
                    fileUrl: `/uploads/contacts/${file.filename}`,
                    mimeType: file.mimetype,
                }));

                await tx.contactAttachment.createMany({
                    data: attachmentData,
                });
            }

            return contact;
        });

        // Notify Admins (optional but recommended)
        await this.notifyAdmins(submission);

        await this.redisService.deleteByPattern(
            'contacts:admin:*',
        );

        if (userId) {
            await this.redisService.deleteByPattern(
                `contacts:${userId}:*`,
            );
        }

        return {
            message: 'Your message has been submitted successfully. We will get back to you soon.',
            submissionId: submission.id,
        };
    }

    private async notifyAdmins(submission: any) {
        try {
            const admins = await this.prisma.user.findMany({
                where: { role: 'ADMIN' },
                select: { id: true },
            });

            await Promise.all(
                admins.map((admin) =>
                    this.notificationService?.createNotification(
                        admin.id,
                        'New Contact Submission',
                        `${submission.name} submitted a contact request: ${submission.subject}`,
                        'NEW_CONTACT_SUBMISSION',
                        { submissionId: submission.id, subject: submission.subject },
                    ),
                ),
            );
        } catch (error) {
            // Log but don't fail the request
            console.warn('Failed to notify admins:', error.message);
        }
    }

    // ==================== ADMIN: LIST CONTACTS ====================
    async getAllContactSubmissions(
        user: any,
        query: GetContactsQueryDto,
    ) {
        const {
            page = 1,
            limit = 20,
            status,
            search,
        } = query;

        const skip =
            (page - 1) * limit;

        const cacheKey =
            user.role === 'ADMIN'
                ? `contacts:admin:${page}:${limit}:${status || 'all'}:${search || 'all'}`
                : `contacts:${user.id}:${page}:${limit}:${status || 'all'}:${search || 'all'}`;

        const cached =
            await this.redisService.get(cacheKey);

        if (cached) {
            return cached;
        }

        const where: any = {};

        if (user.role !== 'ADMIN') {
            where.userId = user.id;
        }

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                {
                    name: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    email: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    message: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
            ];
        }

        const [data, total] =
            await Promise.all([
                this.prisma.contactSubmission.findMany({
                    where,
                    include: {
                        attachments: true,
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                    skip,
                    take: limit,
                }),

                this.prisma.contactSubmission.count({
                    where,
                }),
            ]);

        const result = {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(
                    total / limit,
                ),
            },
        };

        await this.redisService.set(
            cacheKey,
            result,
            120,
        );

        return result;
    }

    // ==================== ADMIN: GET SINGLE CONTACT ====================
    async getContactSubmissionById(
        id: string,
    ) {
        const cacheKey =
            `admin:contacts:detail:${id}`;

        const cached =
            await this.redisService.get(cacheKey);

        if (cached) {
            return cached;
        }

        const submission =
            await this.prisma.contactSubmission.findUnique({
                where: {
                    id,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                    attachments: true,
                },
            });

        if (!submission) {
            throw new NotFoundException(
                'Contact submission not found',
            );
        }

        await this.redisService.set(
            cacheKey,
            submission,
            300,
        );

        return submission;
    }

    // ==================== ADMIN: UPDATE STATUS ====================

    async updateContactStatus(
        id: string,
        status: ContactStatus,
        adminId: string,
    ) {
        const submission = await this.prisma.contactSubmission.update({
            where: { id },
            data: {
                status,
                updatedAt: new Date(),
            },
            include: { attachments: true },
        });

        await this.redisService.deleteByPattern(
            'contacts:admin:*',
        );



        if (submission.userId) {

            await this.redisService.deleteByPattern(
                `contacts:${submission.userId}:*`,
            );
        }

        await this.redisService.del(
            `admin:contacts:detail:${id}`,
        );

        return {
            message: `Contact status updated to ${status}`,
            submission,
        };
    }
}