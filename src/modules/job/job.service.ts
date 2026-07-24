import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JobStatus, ContentType } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { TraderMatchingService } from '../trader-matching/trader-matching.service';
import { NotificationService } from '../notification/notification.service';
import { UpdateJobDto } from './dto/update-job.dto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { RedisService } from 'src/redis/redis.service';
import { GetMyJobsDto } from './dto/get-my-job.dto';
import { GetMatchedJobsDto } from './dto/get-match-job.dto';
import { ModerationService } from '../moderation/moderation.service';

@Injectable()
export class JobService {
    private readonly logger = new Logger(JobService.name);


    constructor(
        private readonly prisma: PrismaService,
        private readonly traderMatchingService: TraderMatchingService,
        private notificationService: NotificationService,
        @InjectQueue('matching') private readonly matchingQueue: Queue,
        @InjectQueue('escalation') private readonly escalationQueue: Queue,
        private redisService: RedisService,
        private readonly moderationService: ModerationService,
    ) { }

    async createJob(
        customerId: string,
        dto: CreateJobDto,
        files: Express.Multer.File[],
    ) {

        /*
        |--------------------------------------------------------------------------
        | DAILY LIMIT
        |--------------------------------------------------------------------------
        */

        const startOfDay = new Date();

        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();

        endOfDay.setHours(23, 59, 59, 999);

        const todayJobs =
            await this.prisma.job.count({
                where: {
                    customerId,

                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            });

        if (todayJobs >= 3) {
            throw new BadRequestException(
                'Daily limit exceeded',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | CREATE JOB
        |--------------------------------------------------------------------------
        */

        const job =
            await this.prisma.job.create({
                data: {
                    customerId,

                    categoryId: dto.categoryId,

                    skillServiceId: dto.skillServiceId,

                    subCategoryId: dto.subCategoryId,

                    postcode: dto.postcode,

                    latitude: dto.latitude,

                    longitude: dto.longitude,

                    title: dto.title,

                    description: dto.description,

                    timescale: dto.timescale,

                    emergency: dto.emergency ?? false,

                    budgetRange: dto.budgetRange,

                    expiresAt: new Date(
                        Date.now() +
                        30 * 24 * 60 * 60 * 1000,
                    ),

                    attachments: {
                        create:
                            files?.map((file) => ({
                                file: `uploads/jobs/${file.filename}`,
                            })) || [],
                    },
                },

                include: {
                    attachments: true,

                    category: true,

                    subCategory: true,

                    skillService: true,

                    customer: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
            });

        // Enqueue matching to background worker
        await this.matchingQueue.add('match-job', { jobId: job.id });

        // Enqueue the first delayed job escalation (20-minute delay)
        await this.escalationQueue.add(
            'escalate-job',
            { jobId: job.id, expectedVersion: 0 },
            { delay: 20 * 60 * 1000 }
        );

        await this.moderationService.scanContent(
            customerId,
            dto.title,
            ContentType.JOB,
            job.id,
        );
        await this.moderationService.scanContent(
            customerId,
            dto.description,
            ContentType.JOB,
            job.id,
        );
        // clear redis cache
        await this.redisService.deleteByPattern(
            `customer:jobs:${customerId}:*`,
        );
        await this.redisService.deleteByPattern(
            'admin:jobs:*',
        );
        return {
            message: 'Job created successfully',

            data: {
                ...job,

                attachments:
                    job.attachments.map((attachment) => ({
                        ...attachment,

                        url: `${process.env.APP_URL}/${attachment.file}`,
                    })),
            },
        };
    }

    async updateJob(
        customerId: string,
        jobId: string,
        dto: UpdateJobDto,
        files: Express.Multer.File[] = [],
    ) {

        /*
        |--------------------------------------------------------------------------
        | FIND JOB
        |--------------------------------------------------------------------------
        */

        const existingJob =
            await this.prisma.job.findUnique({
                where: {
                    id: jobId,
                },

                include: {
                    attachments: true,
                },
            });

        if (!existingJob) {
            throw new NotFoundException(
                'Job not found',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | OWNERSHIP
        |--------------------------------------------------------------------------
        */

        if (
            existingJob.customerId !== customerId
        ) {
            throw new ForbiddenException(
                'Unauthorized',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | BLOCK EDITING
        |--------------------------------------------------------------------------
        */

        if (
            existingJob.status === 'COMPLETED' ||
            existingJob.status === 'CANCELLED' ||
            existingJob.status === 'ASSIGNED' ||
            existingJob.status === 'IN_PROGRESS' ||
            existingJob.status === 'CLOSED'
        ) {
            throw new BadRequestException(
                'This job can no longer be edited',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | DETECT IMPORTANT FIELD CHANGES
        |--------------------------------------------------------------------------
        */

        const isCriticalEdit =

            (
                dto.categoryId !== undefined &&
                dto.categoryId !== existingJob.categoryId
            ) ||

            (
                dto.skillServiceId !== undefined &&
                dto.skillServiceId !== existingJob.skillServiceId
            ) ||

            (
                dto.subCategoryId !== undefined &&
                dto.subCategoryId !== existingJob.subCategoryId
            ) ||

            (
                dto.latitude !== undefined &&
                dto.latitude !== Number(existingJob.latitude)
            ) ||

            (
                dto.longitude !== undefined &&
                dto.longitude !== Number(existingJob.longitude)
            );

        /*
        |--------------------------------------------------------------------------
        | BLOCK CRITICAL EDITS AFTER QUOTES
        |--------------------------------------------------------------------------
        */

        const hasQuotes =
            existingJob.quotesReceived > 0;

        if (
            hasQuotes &&
            isCriticalEdit
        ) {
            throw new BadRequestException(
                'Cannot change category or location after receiving quotes',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | REMOVE OLD FILES FROM SERVER
        |--------------------------------------------------------------------------
        */

        if (
            (
                dto.replaceFiles ||
                files.length > 0
            ) &&
            existingJob.attachments.length > 0
        ) {

            for (const attachment of existingJob.attachments) {

                try {

                    const filePath =
                        path.join(
                            process.cwd(),
                            attachment.file,
                        );

                    await fs.unlink(filePath);

                } catch (error) {

                    this.logger.warn(
                        `Failed to delete file ${attachment.file}: ${error.message}`,
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | DELETE OLD ATTACHMENTS FROM DB
            |--------------------------------------------------------------------------
            */

            await this.prisma.jobAttachment.deleteMany({
                where: {
                    jobId,
                },
            });
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE JOB
        |--------------------------------------------------------------------------
        */

        const updated =
            await this.prisma.job.update({

                where: {
                    id: jobId,
                },

                data: {

                    ...(dto.categoryId !== undefined && {
                        categoryId:
                            dto.categoryId,
                    }),

                    ...(dto.skillServiceId !== undefined && {
                        skillServiceId:
                            dto.skillServiceId,
                    }),

                    ...(dto.subCategoryId !== undefined && {
                        subCategoryId:
                            dto.subCategoryId,
                    }),

                    ...(dto.postcode !== undefined && {
                        postcode:
                            dto.postcode,
                    }),

                    ...(dto.latitude !== undefined && {
                        latitude:
                            dto.latitude,
                    }),

                    ...(dto.longitude !== undefined && {
                        longitude:
                            dto.longitude,
                    }),

                    ...(dto.title !== undefined && {
                        title:
                            dto.title,
                    }),

                    ...(dto.description !== undefined && {
                        description:
                            dto.description,
                    }),

                    ...(dto.timescale !== undefined && {
                        timescale:
                            dto.timescale,
                    }),

                    ...(dto.emergency !== undefined && {
                        emergency:
                            dto.emergency,
                    }),

                    ...(dto.budgetRange !== undefined && {
                        budgetRange:
                            dto.budgetRange,
                    }),

                    ...(files.length > 0 && {

                        attachments: {

                            create:
                                files.map((file) => ({
                                    file:
                                        `uploads/jobs/${file.filename}`,
                                })),
                        },
                    }),
                },

                include: {

                    attachments: true,

                    category: true,

                    subCategory: true,

                    skillService: true,

                    customer: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
            });

        /*
        |--------------------------------------------------------------------------
        | REMATCH LOGIC
        |--------------------------------------------------------------------------
        */

        if (isCriticalEdit) {

            /*
            |--------------------------------------------------------------------------
            | FIND OLD MATCHES
            |--------------------------------------------------------------------------
            */

            const oldMatches =
                await this.prisma.jobTraderMatch.findMany({
                    where: {
                        jobId,
                    },

                    select: {
                        traderId: true,
                    },
                });

            await Promise.all(
                oldMatches.map(match =>
                    this.redisService.deleteByPattern(
                        `trader:matched-jobs:${match.traderId}:*`,
                    ),
                    this.redisService.deleteByPattern(
                        'admin:jobs:*',
                    )
                ),
            );

            /*
            |--------------------------------------------------------------------------
            | DECREMENT FAIRNESS ONLY
            |--------------------------------------------------------------------------
            */

            for (const match of oldMatches) {

                await this.prisma.$executeRaw`
                UPDATE "TraderMetrics"

                SET
                    "recentLeads" =
                        GREATEST(
                            0,
                            "recentLeads" - 1
                        )

                WHERE "traderId" =
                    ${match.traderId}
            `;
            }

            /*
            |--------------------------------------------------------------------------
            | DELETE OLD MATCHES
            |--------------------------------------------------------------------------
            */

            await this.prisma.jobTraderMatch.deleteMany({
                where: {
                    jobId,
                },
            });

            /*
            |--------------------------------------------------------------------------
            | DELETE ESCALATION LOGS
            |--------------------------------------------------------------------------
            */

            await this.prisma.jobEscalationLog.deleteMany({
                where: {
                    jobId,
                },
            });

            /*
            |--------------------------------------------------------------------------
            | RESET ESCALATION STATE
            |--------------------------------------------------------------------------
            */

            await this.prisma.job.update({
                where: {
                    id: jobId,
                },

                data: {

                    currentRadiusKm: 10,

                    escalationVersion: 0,

                    lastEscalatedAt: null,

                    status: 'POSTED',
                },
            });

            /*
            |--------------------------------------------------------------------------
            | RESTART MATCHING
            |--------------------------------------------------------------------------
            */

            await this.matchingQueue.add(
                'match-job',
                {
                    jobId,
                },
                {
                    attempts: 3,

                    backoff: {
                        type: 'exponential',
                        delay: 5000,
                    },

                    removeOnComplete: 100,

                    removeOnFail: 1000,
                },
            );

            /*
            |--------------------------------------------------------------------------
            | RESTART ESCALATION
            |--------------------------------------------------------------------------
            */

            await this.escalationQueue.add(
                'escalate-job',
                {
                    jobId,
                    expectedVersion: 0,
                },
                {
                    delay:
                        20 * 60 * 1000,
                },
            );
        }

        await this.redisService.deleteByPattern(
            `customer:jobs:${customerId}:*`,
        );
        await this.redisService.deleteByPattern(
            'admin:jobs:*',
        );
        await this.redisService.del(`admin:job:${jobId}`);

        // checking for violation
        if (dto.description?.trim()) {
            await this.moderationService.scanContent(
                customerId,
                dto.description,
                ContentType.JOB,
                jobId,
            );
        }

        return {

            message:
                'Job updated successfully',

            data: {

                ...updated,

                attachments:
                    updated.attachments.map(
                        (attachment) => ({
                            ...attachment,

                            url:
                                `${process.env.APP_URL}/${attachment.file}`,
                        }),
                    ),
            },
        };
    }

    async getMyJobs(
        customerId: string,
        query: GetMyJobsDto,
    ) {
        const {
            page = 1,
            limit = 10,
            search,
        } = query;

        const skip = (page - 1) * limit;

        const cacheKey = `customer:jobs:${customerId}:${JSON.stringify({
            page,
            limit,
            search,
        })}`;

        const cached =
            await this.redisService.get(cacheKey);

        if (cached) {
            return cached;
        }

        const where: any = {
            customerId,
        };

        if (search) {
            where.OR = [
                {
                    title: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    description: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
            ];
        }

        const [jobs, total] =
            await Promise.all([
                this.prisma.job.findMany({
                    where,

                    include: {
                        attachments: true,
                        category: true,
                        subCategory: true,
                        skillService: true,

                        selectedTrader: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                        },

                        _count: {
                            select: {
                                quotes: true,
                            },
                        },
                    },

                    orderBy: {
                        createdAt: 'desc',
                    },

                    skip,
                    take: limit,
                }),

                this.prisma.job.count({
                    where,
                }),
            ]);

        const result = {
            message: 'Jobs fetched successfully',

            data: jobs.map((job) => ({
                ...job,

                attachments:
                    job.attachments.map(
                        (attachment) => ({
                            ...attachment,
                            url: `${process.env.APP_URL}/${attachment.file}`,
                        }),
                    ),

                quotesCount:
                    job._count.quotes,
            })),

            meta: {
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

    async getMatchedJobs(
        traderId: string,
        query: GetMatchedJobsDto,
    ) {

        const {
            page = 1,
            limit = 10,
            search,
        } = query;

        const skip = (page - 1) * limit;

        const cacheKey =
            `trader:matched-jobs:${traderId}:${JSON.stringify({
                page,
                limit,
                search,
            })}`;

        const cached =
            await this.redisService.get(cacheKey);

        if (cached) {
            return cached;
        }

        const where: any = {
            traderId,
        };

        if (search) {
            where.job = {
                OR: [
                    {
                        title: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        description: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                ],
            };
        }

        const [matches, total] =
            await Promise.all([

                this.prisma.jobTraderMatch.findMany({
                    where,

                    include: {
                        job: {
                            include: {
                                category: true,
                                subCategory: true,
                                skillService: true,
                                attachments: true,

                                customer: {
                                    select: {
                                        id: true,
                                        fullName: true,
                                        profileImage: true,
                                    },
                                },

                                _count: {
                                    select: {
                                        quotes: true,
                                    },
                                },
                            },
                        },
                    },

                    orderBy: {
                        sentAt: 'desc',
                    },

                    skip,
                    take: limit,
                }),

                this.prisma.jobTraderMatch.count({
                    where,
                }),
            ]);

        const result = {
            message:
                'Matched jobs fetched successfully',

            data: matches.map((match) => ({
                matchId: match.id,

                radiusKm: match.radiusKm,

                matchStatus: match.status,

                sentAt: match.sentAt,

                respondedAt: match.respondedAt,

                ...match.job,

                attachments:
                    match.job.attachments.map(
                        (attachment) => ({
                            ...attachment,

                            url: `${process.env.APP_URL}/${attachment.file}`,
                        }),
                    ),

                quotesCount:
                    match.job._count.quotes,
            })),

            meta: {
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
            300, // 5 min
        );

        return result;
    }

    async startJob(
        customerId: string,
        jobId: string,
    ) {

        /*
        |--------------------------------------------------------------------------
        | FIND JOB
        |--------------------------------------------------------------------------
        */

        const job =
            await this.prisma.job.findUnique({
                where: {
                    id: jobId,
                },
            });

        if (!job) {
            throw new NotFoundException(
                'Job not found',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | AUTHORIZATION
        |--------------------------------------------------------------------------
        */

        if (job.customerId !== customerId) {
            throw new ForbiddenException(
                'Unauthorized',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | STATUS CHECK
        |--------------------------------------------------------------------------
        */

        if (job.status !== JobStatus.ASSIGNED) {
            throw new BadRequestException(
                'Only assigned jobs can be started',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE JOB STATUS
        |--------------------------------------------------------------------------
        */

        const updatedJob =
            await this.prisma.job.update({
                where: {
                    id: jobId,
                },

                data: {
                    status:
                        JobStatus.IN_PROGRESS,
                },
            });

        /*
        |--------------------------------------------------------------------------
        | NOTIFICATION
        |--------------------------------------------------------------------------
        */

        this.notificationService
            .createNotification(
                job.selectedTraderId!,
                'Job Started',
                `Job "${job.title}" is now in progress`,
                'JOB_STARTED',
                {
                    jobId,
                },
            )
            .catch(() => { });

        await this.redisService.deleteByPattern(
            `customer:jobs:${customerId}:*`,
        );
        await this.redisService.deleteByPattern(
            `trader:matched-jobs:${job.selectedTraderId}:*`,
        );
        await this.redisService.deleteByPattern(
            'admin:jobs:*',
        );
        await this.redisService.del(`admin:job:${jobId}`);
        return {
            message:
                'Job started successfully',

            data: updatedJob,
        };
    }

    async completeJob(
        customerId: string,
        jobId: string,
    ) {

        /*
        |--------------------------------------------------------------------------
        | FIND JOB
        |--------------------------------------------------------------------------
        */

        const job =
            await this.prisma.job.findUnique({
                where: {
                    id: jobId,
                },
            });

        if (!job) {
            throw new NotFoundException(
                'Job not found',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | AUTHORIZATION
        |--------------------------------------------------------------------------
        */

        if (job.customerId !== customerId) {
            throw new ForbiddenException(
                'Unauthorized',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | STATUS CHECK
        |--------------------------------------------------------------------------
        */

        if (
            job.status !== JobStatus.IN_PROGRESS
        ) {
            throw new BadRequestException(
                'Only in-progress jobs can be completed',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | TRANSACTION
        |--------------------------------------------------------------------------
        */

        const updatedJob =
            await this.prisma.$transaction(
                async (tx) => {

                    /*
                    |--------------------------------------------------------------------------
                    | COMPLETE JOB
                    |--------------------------------------------------------------------------
                    */

                    const completedJob =
                        await tx.job.update({
                            where: {
                                id: jobId,
                            },

                            data: {
                                status:
                                    JobStatus.COMPLETED,
                            },
                        });

                    /*
                    |--------------------------------------------------------------------------
                    | UPDATE TRADER METRICS
                    |--------------------------------------------------------------------------
                    */

                    await tx.traderMetrics.update({
                        where: {
                            traderId:
                                job.selectedTraderId!,
                        },

                        data: {

                            completedJobs: {
                                increment: 1,
                            },
                        },
                    });

                    return completedJob;
                },
            );


        /*
        |--------------------------------------------------------------------------
        | NOTIFICATION
        |--------------------------------------------------------------------------
        */

        await this.redisService.deleteByPattern(
            `customer:jobs:${customerId}:*`,
        );
        await this.redisService.deleteByPattern(
            `trader:matched-jobs:${job.selectedTraderId}:*`,
        );
        await this.redisService.deleteByPattern(
            'admin:jobs:*',
        );
        await this.redisService.del(`admin:job:${jobId}`);

        await this.notificationService
            .createNotification(
                job.selectedTraderId!,
                'Job Completed',
                `Job "${job.title}" has been marked completed`,
                'JOB_COMPLETED',
                {
                    jobId,
                },
            )
            .catch(() => { });

        return {

            message:
                'Job completed successfully',

            data: updatedJob,
        };
    }


    async cancelJob(
        customerId: string,
        jobId: string,
    ) {

        /*
        |--------------------------------------------------------------------------
        | FIND JOB
        |--------------------------------------------------------------------------
        */

        const job =
            await this.prisma.job.findUnique({
                where: {
                    id: jobId,
                },
            });

        if (!job) {
            throw new NotFoundException(
                'Job not found',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | AUTHORIZATION
        |--------------------------------------------------------------------------
        */

        if (job.customerId !== customerId) {
            throw new ForbiddenException(
                'Unauthorized',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | STATUS CHECK
        |--------------------------------------------------------------------------
        */

        if (
            job.status !== JobStatus.ASSIGNED &&
            job.status !== JobStatus.IN_PROGRESS
        ) {
            throw new BadRequestException(
                'Only assigned or in-progress jobs can be cancelled',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | CANCEL JOB
        |--------------------------------------------------------------------------
        */

        const updatedJob =
            await this.prisma.job.update({
                where: {
                    id: jobId,
                },

                data: {
                    status:
                        JobStatus.CANCELLED,
                },
            });

        /*
        |--------------------------------------------------------------------------
        | NOTIFICATION
        |--------------------------------------------------------------------------
        */

        if (job.selectedTraderId) {

            this.notificationService
                .createNotification(
                    job.selectedTraderId,
                    'Job Cancelled',
                    `Job "${job.title}" was cancelled`,
                    'JOB_CANCELLED',
                    {
                        jobId,
                    },
                )
                .catch(() => { });
        }

        await this.redisService.deleteByPattern(
            `customer:jobs:${customerId}:*`,
        );
        await this.redisService.deleteByPattern(
            `trader:matched-jobs:${job.selectedTraderId}:*`,
        );
        await this.redisService.deleteByPattern(
            'admin:jobs:*',
        );
        await this.redisService.del(`admin:job:${jobId}`);

        return {

            message:
                'Job cancelled successfully',

            data: updatedJob,
        };
    }


    async pauseDistribution(
        adminId: string,
        jobId: string,
    ) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
        });

        if (!job) {
            throw new NotFoundException(
                'Job not found',
            );
        }

        // Optional: avoid unnecessary updates
        if (job.distributionStatus === 'PAUSED') {
            throw new BadRequestException(
                'Job distribution is already paused',
            );
        }

        await this.prisma.job.update({
            where: { id: jobId },
            data: {
                distributionStatus: 'PAUSED',
            },
        });

        await this.prisma.adminJobActionLog.create({
            data: {
                jobId,
                adminId,
                action: 'PAUSE_DISTRIBUTION',

                metadata: {
                    previousStatus:
                        job.distributionStatus,
                    newStatus: 'PAUSED',
                    pausedAt: new Date(),
                },
            },
        });

        // Clear related caches
        await Promise.all([
            this.redisService.deleteByPattern(
                'admin:manual-review-jobs:*',
            ),

            this.redisService.deleteByPattern(
                `customer:jobs:${job.customerId}:*`,
            ),

            this.redisService.deleteByPattern(
                'admin:jobs:*',
            ),
            this.redisService.del(`admin:job:${jobId}`),
        ]);

        return {
            message:
                'Job distribution paused successfully',
        };
    }

    async resumeDistribution(
        adminId: string,
        jobId: string,
    ) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
        });

        if (!job) {
            throw new NotFoundException(
                'Job not found',
            );
        }

        if (
            job.distributionStatus === 'AUTO'
        ) {
            throw new BadRequestException(
                'Job distribution is already active',
            );
        }

        await this.prisma.job.update({
            where: { id: jobId },
            data: {
                distributionStatus: 'AUTO',
            },
        });

        // Immediately rematch
        await this.matchingQueue.add(
            'match-job',
            { jobId },
        );

        // Resume escalation chain
        await this.escalationQueue.add(
            'escalate-job',
            {
                jobId,
                expectedVersion:
                    job.escalationVersion,
            },
            {
                delay: 20 * 60 * 1000,
            },
        );

        // Audit log
        await this.prisma.adminJobActionLog.create({
            data: {
                jobId,
                adminId,
                action: 'RESUME_DISTRIBUTION',

                metadata: {
                    previousStatus:
                        job.distributionStatus,
                    newStatus: 'AUTO',
                    resumedAt: new Date(),
                    escalationVersion:
                        job.escalationVersion,
                },
            },
        });

        // Clear caches
        await Promise.all([
            this.redisService.deleteByPattern(
                'admin:manual-review-jobs:*',
            ),

            this.redisService.deleteByPattern(
                `customer:jobs:${job.customerId}:*`,
            ),

            this.redisService.deleteByPattern(
                'admin:jobs:*',
            ),
            this.redisService.del(`admin:job:${jobId}`),
        ]);

        return {
            message:
                'Job distribution resumed successfully',
        };
    }

    async restartAutoDistribution(
        adminId: string,
        jobId: string,
    ) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
        });

        if (!job) {
            throw new NotFoundException(
                'Job not found',
            );
        }

        const previousState = {
            distributionStatus:
                job.distributionStatus,
            currentRadiusKm:
                job.currentRadiusKm,
            escalationVersion:
                job.escalationVersion,
        };

        await this.prisma.job.update({
            where: { id: jobId },
            data: {
                distributionStatus: 'AUTO',
                currentRadiusKm: 10, // default radius
                escalationVersion: 0,
                lastEscalatedAt: null,
            },
        });

        // Trigger fresh matching
        await this.matchingQueue.add(
            'match-job',
            { jobId },
        );

        // Restart escalation chain
        await this.escalationQueue.add(
            'escalate-job',
            {
                jobId,
                expectedVersion: 0,
            },
            {
                delay: 20 * 60 * 1000,
            },
        );

        // Audit log
        await this.prisma.adminJobActionLog.create({
            data: {
                jobId,
                adminId,
                action: 'RESTART_AUTO_DISTRIBUTION',

                metadata: {
                    previousState,
                    newState: {
                        distributionStatus:
                            'AUTO',
                        currentRadiusKm: 10,
                        escalationVersion: 0,
                    },
                    restartedAt: new Date(),
                },
            },
        });

        // Clear caches
        await Promise.all([
            this.redisService.deleteByPattern(
                'admin:manual-review-jobs:*',
            ),

            this.redisService.deleteByPattern(
                `customer:jobs:${job.customerId}:*`,
            ),

            this.redisService.deleteByPattern(
                'admin:jobs:*',
            ),
            this.redisService.del(`admin:job:${jobId}`),
        ]);

        return {
            message:
                'Automatic distribution restarted successfully',
        };
    }

    async increaseRadius(
        adminId: string,
        jobId: string,
        additionalRadius: number,
    ) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
        });

        if (!job) {
            throw new NotFoundException(
                'Job not found',
            );
        }

        const previousRadius =
            job.currentRadiusKm;

        const newRadius = Math.min(
            100,
            previousRadius + additionalRadius,
        );

        if (newRadius === previousRadius) {
            throw new BadRequestException(
                'Job is already at maximum radius (100 km)',
            );
        }

        const updatedJob =
            await this.prisma.job.update({
                where: { id: jobId },
                data: {
                    currentRadiusKm: newRadius,
                    escalationVersion: {
                        increment: 1,
                    },
                },
            });

        // Trigger fresh matching with expanded radius
        await this.matchingQueue.add(
            'match-job',
            { jobId },
        );

        // Audit log
        await this.prisma.adminJobActionLog.create({
            data: {
                jobId,
                adminId,
                action: 'INCREASE_RADIUS',

                metadata: {
                    previousRadiusKm:
                        previousRadius,
                    addedRadiusKm:
                        additionalRadius,
                    newRadiusKm:
                        newRadius,
                    previousEscalationVersion:
                        job.escalationVersion,
                    newEscalationVersion:
                        updatedJob.escalationVersion,
                },
            },
        });

        // Clear caches
        await Promise.all([
            this.redisService.deleteByPattern(
                'admin:manual-review-jobs:*',
            ),

            this.redisService.deleteByPattern(
                `customer:jobs:${job.customerId}:*`,
            ),

            this.redisService.deleteByPattern(
                'admin:jobs:*',
            ),
            this.redisService.del(`admin:job:${jobId}`),
        ]);

        return {
            message: `Radius increased to ${newRadius} km`,
            previousRadiusKm: previousRadius,
            newRadiusKm: newRadius,
        };
    }

    async closeDistribution(
        adminId: string,
        jobId: string,
    ) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
        });

        if (!job) {
            throw new NotFoundException(
                'Job not found',
            );
        }

        if (
            job.distributionStatus === 'COMPLETED'
        ) {
            throw new BadRequestException(
                'Job distribution is already closed',
            );
        }

        await this.prisma.job.update({
            where: { id: jobId },
            data: {
                distributionStatus: 'COMPLETED',
                status: 'CLOSED', // if supported by your enum
            },
        });

        // Optional: prevent future escalation processing
        await this.prisma.job.update({
            where: { id: jobId },
            data: {
                escalationVersion: {
                    increment: 1,
                },
            },
        });

        // Audit log
        await this.prisma.adminJobActionLog.create({
            data: {
                jobId,
                adminId,
                action: 'CLOSE_JOB',

                metadata: {
                    previousDistributionStatus:
                        job.distributionStatus,
                    newDistributionStatus:
                        'COMPLETED',

                    previousJobStatus:
                        job.status,
                    newJobStatus:
                        'CLOSED',

                    closedAt: new Date(),
                },
            },
        });

        // Clear caches
        await Promise.all([
            this.redisService.deleteByPattern(
                'admin:manual-review-jobs:*',
            ),

            this.redisService.deleteByPattern(
                `customer:jobs:${job.customerId}:*`,
            ),

            this.redisService.deleteByPattern(
                'admin:jobs:*',
            ),
            this.redisService.del(`admin:job:${jobId}`),
        ]);

        return {
            message:
                'Job distribution closed successfully',
        };
    }

    async closeMyJob(
        customerId: string,
        jobId: string,
    ) {
        const job = await this.prisma.job.findFirst({
            where: {
                id: jobId,
                customerId,
            },
        });

        if (!job) {
            throw new NotFoundException(
                'Job not found',
            );
        }

        if (job.distributionStatus === 'COMPLETED') {
            throw new BadRequestException(
                'Job is already closed',
            );
        }

        if (job.status !== 'POSTED') {
            throw new BadRequestException(
                'Only posted jobs can be closed',
            );
        }

        await this.prisma.job.update({
            where: {
                id: jobId,
            },
            data: {
                distributionStatus: 'COMPLETED',
                status: 'CLOSED',
                escalationVersion: {
                    increment: 1,
                },
            },
        });

        await Promise.all([
            this.redisService.deleteByPattern(
                'admin:manual-review-jobs:*',
            ),
            this.redisService.deleteByPattern(
                `customer:jobs:${customerId}:*`,
            ),
            this.redisService.deleteByPattern(
                'admin:jobs:*',
            ),
            this.redisService.del(`admin:job:${jobId}`),
        ]);

        return {
            message: 'Job closed successfully',
        };
    }
}