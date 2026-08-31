import {
    BadRequestException,
    Injectable,
    NotFoundException,
    Logger,
    ForbiddenException,
} from '@nestjs/common';

import {
    JobMatchStatus,
    JobStatus,
    QuoteStatus,
} from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { SocketService } from 'src/socket/socket.service';
import * as fs from 'fs/promises';
import * as path from 'path';

import { CreateQuoteDto } from './dto/create-quote.dto';
import { RedisService } from 'src/redis/redis.service';
import { GetMyQuotesDto } from './dto/get-my-quote.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TraderDashboardService } from '../dashboard/trader-dashboard.service';
import { CustomerDashboardService } from '../dashboard/customer-dashboard.service';

@Injectable()
export class QuoteService {

    private readonly logger = new Logger(QuoteService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService,
        private redisService: RedisService,
        @InjectQueue('matching') private readonly matchingQueue: Queue,
        private readonly socketService: SocketService,
        private readonly traderDashboardService: TraderDashboardService,
        private readonly customerDashboardService: CustomerDashboardService,
    ) { }




    /*
    |--------------------------------------------------------------------------
    | CREATE QUOTE
    |--------------------------------------------------------------------------
    */

    // async createQuote(
    //     traderId: string,
    //     jobId: string,
    //     dto: CreateQuoteDto,
    // ) {

    //     /*
    //     |--------------------------------------------------------------------------
    //     | CHECK JOB
    //     |--------------------------------------------------------------------------
    //     */

    //     const job =
    //         await this.prisma.job.findUnique({
    //             where: {
    //                 id: jobId,
    //             },

    //             include: {
    //                 customer: true,
    //             },
    //         });

    //     if (!job) {
    //         throw new NotFoundException(
    //             'Job not found',
    //         );
    //     }

    //     /*
    //     |--------------------------------------------------------------------------
    //     | JOB STATUS CHECK
    //     |--------------------------------------------------------------------------
    //     */

    //     if (
    //         job.status === JobStatus.ASSIGNED ||
    //         job.status === JobStatus.COMPLETED ||
    //         job.status === JobStatus.CANCELLED
    //     ) {
    //         throw new BadRequestException(
    //             'This job is no longer accepting quotes',
    //         );
    //     }

    //     /*
    //     |--------------------------------------------------------------------------
    //     | PREVENT SELF QUOTE
    //     |--------------------------------------------------------------------------
    //     */

    //     if (job.customerId === traderId) {
    //         throw new BadRequestException(
    //             'You cannot quote on your own job',
    //         );
    //     }

    //     /*
    //     |--------------------------------------------------------------------------
    //     | VALIDATE PRICE
    //     |--------------------------------------------------------------------------
    //     */

    //     if (dto.price !== undefined) {
    //         if (dto.price <= 0 || !Number.isFinite(dto.price)) {
    //             throw new BadRequestException(
    //                 'Invalid price: must be a positive number',
    //             );
    //         }
    //         if (dto.price > 999999.99) {
    //             throw new BadRequestException(
    //                 'Price exceeds maximum allowed value',
    //             );
    //         }
    //     }

    //     if (dto.estimatedDays !== undefined) {
    //         if (!Number.isInteger(dto.estimatedDays) || dto.estimatedDays < 1 || dto.estimatedDays > 365) {
    //             throw new BadRequestException(
    //                 'Estimated days must be between 1 and 365',
    //             );
    //         }
    //     }

    //     /*
    //     |--------------------------------------------------------------------------
    //     | CREATE QUOTE (WITH RACE CONDITION HANDLING)
    //     |--------------------------------------------------------------------------
    //     */

    //     const result =
    //         await this.prisma.$transaction(
    //             async (tx) => {

    //                 /*
    //                 |--------------------------------------------------------------------------
    //                 | CHECK QUOTE LIMIT INSIDE TRANSACTION (fix race condition)
    //                 |--------------------------------------------------------------------------
    //                 */

    //                 const totalQuotes =
    //                     await tx.quote.count({
    //                         where: {
    //                             jobId,
    //                         },
    //                     });

    //                 if (totalQuotes >= 3) {
    //                     throw new BadRequestException(
    //                         'Quote limit reached',
    //                     );
    //                 }

    //                 /*
    //                 |--------------------------------------------------------------------------
    //                 | CHECK DUPLICATE QUOTE (unique constraint will handle race)
    //                 |--------------------------------------------------------------------------
    //                 */

    //                 const existingQuote =
    //                     await tx.quote.findFirst({
    //                         where: {
    //                             jobId,
    //                             traderId,
    //                         },
    //                     });

    //                 if (existingQuote) {
    //                     throw new BadRequestException(
    //                         'You already submitted a quote for this job',
    //                     );
    //                 }

    //                 /*
    //                 |--------------------------------------------------------------------------
    //                 | CREATE QUOTE
    //                 |--------------------------------------------------------------------------
    //                 */

    //                 const quote =
    //                     await tx.quote.create({
    //                         data: {
    //                             traderId,
    //                             jobId,
    //                             price: dto.price,
    //                             estimatedDays:
    //                                 dto.estimatedDays,
    //                             message: dto.message,
    //                         },

    //                         include: {
    //                             trader: {
    //                                 select: {
    //                                     id: true,
    //                                     fullName: true,
    //                                     email: true,
    //                                 },
    //                             },

    //                             job: {
    //                                 select: {
    //                                     id: true,
    //                                     title: true,
    //                                     status: true,
    //                                 },
    //                             },
    //                         },
    //                     });

    //                 await tx.job.update({
    //                     where: {
    //                         id: jobId,
    //                     },

    //                     data: {
    //                         quotesReceived: {
    //                             increment: 1,
    //                         },

    //                         status:
    //                             JobStatus.QUOTE_RECEIVED,
    //                     },
    //                 });

    //                 await tx.jobTraderMatch.update({
    //                     where: {
    //                         jobId_traderId: {
    //                             jobId,
    //                             traderId,
    //                         },
    //                     },

    //                     data: {
    //                         status:
    //                             JobMatchStatus.QUOTED,

    //                         respondedAt:
    //                             new Date(),
    //                     },
    //                 });

    //                 return quote;
    //             },
    //         );
    //     await this.recalculateTraderResponseMetrics(
    //         traderId,
    //     );
    //     return {
    //         message:
    //             'Quote submitted successfully',

    //         data: result,
    //     };
    // }



    async createQuote(
        traderId: string,
        jobId: string,
        dto: CreateQuoteDto,
        files: Express.Multer.File[] = [],
    ) {

        /*
        |--------------------------------------------------------------------------
        | CHECK JOB
        |--------------------------------------------------------------------------
        */

        const job =
            await this.prisma.job.findUnique({
                where: {
                    id: jobId,
                },

                include: {
                    customer: true,
                },
            });

        if (!job) {
            throw new NotFoundException(
                'Job not found',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | JOB STATUS CHECK
        |--------------------------------------------------------------------------
        */

        if (
            job.status === JobStatus.ASSIGNED ||
            job.status === JobStatus.COMPLETED ||
            job.status === JobStatus.CANCELLED
        ) {
            throw new BadRequestException(
                'This job is no longer accepting quotes',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | PREVENT SELF QUOTE
        |--------------------------------------------------------------------------
        */

        if (job.customerId === traderId) {
            throw new BadRequestException(
                'You cannot quote on your own job',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDATE PRICE
        |--------------------------------------------------------------------------
        */

        if (dto.price !== undefined) {

            if (
                dto.price <= 0 ||
                !Number.isFinite(dto.price)
            ) {
                throw new BadRequestException(
                    'Invalid price: must be a positive number',
                );
            }

            if (dto.price > 999999.99) {
                throw new BadRequestException(
                    'Price exceeds maximum allowed value',
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDATE ESTIMATED DAYS
        |--------------------------------------------------------------------------
        */

        if (dto.estimatedDays !== undefined) {

            if (
                !Number.isInteger(dto.estimatedDays) ||
                dto.estimatedDays < 1 ||
                dto.estimatedDays > 365
            ) {
                throw new BadRequestException(
                    'Estimated days must be between 1 and 365',
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | CREATE QUOTE
        |--------------------------------------------------------------------------
        */

        const result =
            await this.prisma.$transaction(
                async (tx) => {

                    /*
                    |--------------------------------------------------------------------------
                    | CHECK QUOTE LIMIT
                    |--------------------------------------------------------------------------
                    */

                    const totalQuotes =
                        await tx.quote.count({
                            where: {
                                jobId,
                            },
                        });

                    if (totalQuotes >= 3) {
                        throw new BadRequestException(
                            'Quote limit reached',
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | PREVENT DUPLICATE QUOTE
                    |--------------------------------------------------------------------------
                    */

                    const existingQuote =
                        await tx.quote.findFirst({
                            where: {
                                jobId,
                                traderId,
                            },
                        });

                    if (existingQuote) {
                        throw new BadRequestException(
                            'You already submitted a quote for this job',
                        );
                    }


                    /*
 |--------------------------------------------------------------------------
 | CHECK SUBSCRIPTION QUOTE LIMIT
 |--------------------------------------------------------------------------
 */

                    const traderProfile =
                        await tx.traderProfile.findUnique({
                            where: {
                                userId: traderId,
                            },
                            include: {
                                subscription: {
                                    include: {
                                        plan: true,
                                    },
                                },
                            },
                        });

                    if (
                        !traderProfile?.subscription?.plan
                    ) {
                        throw new BadRequestException(
                            'No active subscription plan found',
                        );
                    }

                    if (
                        traderProfile.subscription.status !== 'ACTIVE' &&
                        traderProfile.subscription.status !== 'TRIAL'
                    ) {
                        throw new BadRequestException(
                            `Subscription feature blocked. Your subscription status is ${traderProfile.subscription.status}.`,
                        );
                    }

                    const startOfDay = new Date();
                    startOfDay.setUTCHours(
                        0,
                        0,
                        0,
                        0,
                    );

                    const endOfDay = new Date();
                    endOfDay.setUTCHours(
                        23,
                        59,
                        59,
                        999,
                    );

                    const todayQuotes =
                        await tx.quote.count({
                            where: {
                                traderId,
                                createdAt: {
                                    gte: startOfDay,
                                    lte: endOfDay,
                                },
                            },
                        });

                    if (
                        todayQuotes >=
                        traderProfile.subscription.plan.maxQuotesPerDay
                    ) {
                        throw new BadRequestException(
                            `Daily quote limit reached. Your ${traderProfile.subscription.plan.name} plan allows ${traderProfile.subscription.plan.maxQuotesPerDay} quotes per day.`,
                        );
                    }
                    /*
                    |--------------------------------------------------------------------------
                    | FIND JOB MATCH
                    |--------------------------------------------------------------------------
                    */

                    const match =
                        await tx.jobTraderMatch.findUnique({
                            where: {
                                jobId_traderId: {
                                    jobId,
                                    traderId,
                                },
                            },
                        });

                    /*
                    |--------------------------------------------------------------------------
                    | CREATE QUOTE
                    |--------------------------------------------------------------------------
                    */

                    const quote =
                        await tx.quote.create({
                            data: {
                                traderId,
                                jobId,
                                price: dto.price,
                                estimatedDays:
                                    dto.estimatedDays,
                                message: dto.message,
                                attachments: {
                                    create: files?.map((file) => ({
                                        file: `uploads/quotes/${file.filename}`,
                                        filename: file.originalname,
                                        mimeType: file.mimetype,
                                        size: file.size,
                                    })) || [],
                                },
                            },

                            include: {
                                trader: {
                                    select: {
                                        id: true,
                                        fullName: true,
                                        email: true,
                                    },
                                },

                                job: {
                                    select: {
                                        id: true,
                                        title: true,
                                        status: true,
                                    },
                                },

                                attachments: true,
                            },
                        });

                    /*
                    |--------------------------------------------------------------------------
                    | UPDATE JOB
                    |--------------------------------------------------------------------------
                    */

                    await tx.job.update({
                        where: {
                            id: jobId,
                        },

                        data: {
                            quotesReceived: {
                                increment: 1,
                            },

                            status:
                                JobStatus.QUOTE_RECEIVED,
                        },
                    });

                    /*
                    |--------------------------------------------------------------------------
                    | UPDATE MATCH STATUS
                    |--------------------------------------------------------------------------
                    */

                    if (
                        match &&
                        match.status !== JobMatchStatus.QUOTED
                    ) {

                        await tx.jobTraderMatch.update({
                            where: {
                                jobId_traderId: {
                                    jobId,
                                    traderId,
                                },
                            },

                            data: {
                                status:
                                    JobMatchStatus.QUOTED,
                                isQuoteSubmitted: true,
                                respondedAt:
                                    new Date(),
                            },
                        });

                        /*
                        |--------------------------------------------------------------------------
                        | UPDATE RESPONSE METRICS
                        |--------------------------------------------------------------------------
                        */

                        await tx.traderMetrics.upsert({
                            where: {
                                traderId,
                            },

                            create: {
                                traderId,

                                invitesCount: 0,

                                responsesCount: 1,

                                responseRate: 1,

                                averageRating: 0,

                                totalReviews: 0,

                                completedJobs: 0,

                                recentLeads: 0,

                                totalMatchedJobs: 0,

                                cancelledJobs: 0,

                                closedJobs: 0,
                            },

                            update: {
                                responsesCount: {
                                    increment: 1,
                                },
                            },
                        });
                    }

                    return quote;
                },
            );

        /*
        |--------------------------------------------------------------------------
        | RECALCULATE RESPONSE RATE
        |--------------------------------------------------------------------------
        */

        await this.recalculateTraderResponseMetrics(
            traderId,
        );

        await this.redisService.deleteByPattern(
            `customer:jobs:${job.customerId}:*`,
        );
        await this.redisService.deleteByPattern(
            `trader:matched-jobs:${traderId}:*`,
        );
        await this.redisService.del(
            `job:quotes:${jobId}`,
        );
        await this.redisService.deleteByPattern(
            `trader:quotes:${traderId}:*`,
        );
        await this.redisService.del(
            `trader:quote:${traderId}:job:${jobId}`,
        );
        await this.redisService.deleteByPattern(
            'admin:jobs:*',
        );
        await this.redisService.deleteByPattern('admin:quotes:*');

        // Notify customer about new quote
        this.notificationService.createNotification(
            job.customerId,
            'New Quote Received',
            `${result.trader.fullName} has submitted a quote for your job: "${job.title}"`,
            'QUOTE_RECEIVED',
            { jobId, quoteId: result.id },
        ).catch(err => {
            this.logger.error(`Failed to notify customer about new quote: ${err.message}`);
        });

        // Emit newQuote to customer
        const quotePayload = {
            ...result,
            attachments: result?.attachments?.map(a => ({
                ...a,
                url: `${process.env.APP_URL}/${a.file}`,
            })) || [],
        };
        this.socketService.emitToUser(job.customerId, 'newQuote', quotePayload);

        // Emit jobUpdated (due to quote count / status change) to customer and admins
        this.prisma.job.findUnique({
            where: { id: jobId },
        }).then(updatedJob => {
            if (updatedJob) {
                this.socketService.emitToUser(job.customerId, 'jobUpdated', updatedJob);
                this.socketService.emitToRoom('admins', 'jobUpdated', updatedJob);
            }
        }).catch(() => {});

        this.traderDashboardService.emitDashboardUpdate(traderId);
        this.customerDashboardService.emitDashboardUpdate(job.customerId);

        return {
            message:
                'Quote submitted successfully',

            data: {
                ...result,
                attachments: result?.attachments?.map(a => ({
                    ...a,
                    url: `${process.env.APP_URL}/${a.file}`,
                })) || [],
            },
        };
    }

    async recalculateTraderResponseMetrics(
        traderId: string,
    ) {

        const metrics =
            await this.prisma.traderMetrics.findUnique({
                where: {
                    traderId,
                },
            });

        if (!metrics) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | RESPONSE RATE
        |--------------------------------------------------------------------------
        |
        | Examples:
        |
        | 3 / 10 = 0.30
        | 7 / 10 = 0.70
        | 10 / 10 = 1.00
        |--------------------------------------------------------------------------
        */

        const responseRate =
            metrics.invitesCount > 0

                ? (
                    metrics.responsesCount /
                    metrics.invitesCount
                )

                : 0;

        await this.prisma.traderMetrics.update({
            where: {
                traderId,
            },

            data: {
                responseRate:
                    parseFloat(
                        responseRate.toFixed(2),
                    ),
            },
        });
    }
    /*
    |--------------------------------------------------------------------------
    | ACCEPT QUOTE
    |--------------------------------------------------------------------------
    */
    async acceptQuote(
        customerId: string,
        quoteId: string,
    ) {
        /*
        |--------------------------------------------------------------------------
        | FIND QUOTE
        |--------------------------------------------------------------------------
        */
        const quote =
            await this.prisma.quote.findUnique({
                where: {
                    id: quoteId,
                },
                include: {
                    job: true,
                    trader: true,
                },
            });

        if (!quote) {
            throw new NotFoundException(
                'Quote not found',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | AUTHORIZATION
        |--------------------------------------------------------------------------
        */

        if (quote.job.customerId !== customerId) {
            throw new BadRequestException(
                'You are not allowed to accept this quote',
            );
        }
        /*
        |--------------------------------------------------------------------------
        | JOB STATUS CHECK
        |--------------------------------------------------------------------------
        */
        if (
            quote.job.status === JobStatus.ASSIGNED
        ) {
            throw new BadRequestException(
                'Trader already assigned',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | TRANSACTION - FIX CONCURRENT ACCEPTANCE RACE CONDITION
        |--------------------------------------------------------------------------
        */

        try {
            const { rejectedQuotes: txRejectedQuotes, updatedJob } = await this.prisma.$transaction(
                async (tx) => {

                    /*
                    |--------------------------------------------------------------------------
                    | CHECK JOB STATUS AGAIN INSIDE TRANSACTION
                    |--------------------------------------------------------------------------
                    */

                    const freshJob = await tx.job.findUnique({
                        where: { id: quote.jobId },
                    });

                    if (!freshJob || freshJob.status === JobStatus.ASSIGNED) {
                        throw new BadRequestException(
                            'Another trader was already selected for this job, or job not found',
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | ACCEPT THIS QUOTE
                    |--------------------------------------------------------------------------
                    */

                    await tx.quote.update({
                        where: {
                            id: quoteId,
                        },

                        data: {
                            status:
                                QuoteStatus.ACCEPTED,
                        },
                    });

                    /*
                    |--------------------------------------------------------------------------
                    | UPDATE JOB (atomically check and update)
                    |--------------------------------------------------------------------------
                    */

                    const updatedJob = await tx.job.update({
                        where: {
                            id: quote.jobId,
                        },

                        data: {
                            selectedTraderId:
                                quote.traderId,

                            status:
                                JobStatus.ASSIGNED,
                        },
                    });

                    /*
                    |--------------------------------------------------------------------------
                    | VERIFY THIS TRADER WAS SELECTED
                    |--------------------------------------------------------------------------
                    */

                    if (updatedJob.selectedTraderId !== quote.traderId) {
                        throw new BadRequestException(
                            'Failed to assign trader - race condition detected',
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | GET OTHER QUOTES FOR NOTIFICATION
                    |--------------------------------------------------------------------------
                    */

                    const rejectedQuotes =
                        await tx.quote.findMany({
                            where: {
                                jobId: quote.jobId,
                                id: {
                                    not: quoteId,
                                },
                            },
                            select: {
                                id: true,
                                traderId: true,
                            },
                        });

                    /*
                    |--------------------------------------------------------------------------
                    | REJECT OTHER QUOTES
                    |--------------------------------------------------------------------------
                    */

                    await tx.quote.updateMany({
                        where: {
                            jobId: quote.jobId,

                            id: {
                                not: quoteId,
                            },
                        },

                        data: {
                            status:
                                QuoteStatus.REJECTED,
                        },
                    });

                    /*
                    |--------------------------------------------------------------------------
                    | ACCEPTED MATCH STATUS
                    |--------------------------------------------------------------------------
                    */

                    await tx.jobTraderMatch.update({
                        where: {
                            jobId_traderId: {
                                jobId: quote.jobId,

                                traderId:
                                    quote.traderId,
                            },
                        },

                        data: {
                            status:
                                JobMatchStatus.ACCEPTED,

                            respondedAt:
                                new Date(),
                            isSelected: true,
                        },
                    });

                    /*
                    |--------------------------------------------------------------------------
                    | REJECT OTHER MATCHES
                    |--------------------------------------------------------------------------
                    */

                    await tx.jobTraderMatch.updateMany({
                        where: {
                            jobId: quote.jobId,

                            traderId: {
                                not: quote.traderId,
                            },
                        },

                        data: {
                            status:
                                JobMatchStatus.REJECTED,

                            respondedAt:
                                new Date(),
                        },
                    });

                    return { rejectedQuotes, updatedJob };
                },
            );

            /*
            |--------------------------------------------------------------------------
            | SEND NOTIFICATIONS (outside transaction)
            |--------------------------------------------------------------------------
            */

            // Notify accepted trader
            this.notificationService.createNotification(
                quote.traderId,
                'Quote Accepted',
                `Your quote for "${quote.job.title}" has been accepted!`,
                'QUOTE_ACCEPTED',
                { jobId: quote.jobId, quoteId: quoteId },
            ).catch(err => {
                this.logger.error(`Failed to notify accepted trader: ${err.message}`);
            });

            // Get and notify rejected traders
            const rejectedQuotes = await this.prisma.quote.findMany({
                where: {
                    jobId: quote.jobId,
                    status: QuoteStatus.REJECTED,
                },
                select: { traderId: true },
            });
            // Clear cache for selected trader
            await this.redisService.deleteByPattern(
                `trader:matched-jobs:${quote.traderId}:*`,
            );
            await this.redisService.deleteByPattern(
                `trader:quotes:${quote.traderId}:*`,
            );
            // Clear quotes cache
            await this.redisService.del(
                `job:quotes:${quote.jobId}`,
            );
            await this.redisService.del(
                `trader:quote:${quote.traderId}:job:${quote.jobId}`,
            );
            await this.redisService.deleteByPattern(
                'admin:jobs:*',
            );
            await this.redisService.deleteByPattern('admin:quotes:*');

            // Clear cache and notify rejected traders
            await Promise.all(
                rejectedQuotes.map(async rejected => {
                    await this.redisService.deleteByPattern(
                        `trader:matched-jobs:${rejected.traderId}:*`,
                    );
                    await this.redisService.deleteByPattern(
                        `trader:quotes:${rejected.traderId}:*`,
                    );
                    await this.redisService.del(
                        `trader:quote:${rejected.traderId}:job:${quote.jobId}`,
                    );

                    return this.notificationService
                        .createNotification(
                            rejected.traderId,
                            'Quote Not Selected',
                            `Your quote for "${quote.job.title}" was not selected`,
                            'QUOTE_REJECTED',
                            { jobId: quote.jobId },
                        )
                        .catch(err => {
                            this.logger.warn(
                                `Failed to notify rejected trader ${rejected.traderId}: ${err.message}`,
                            );
                        });
                }),
            );

            // Emit quote status updates to traders
            this.socketService.emitToUser(quote.traderId, 'quoteUpdated', {
                id: quoteId,
                status: QuoteStatus.ACCEPTED,
            });
            for (const rejected of txRejectedQuotes) {
                this.socketService.emitToUser(rejected.traderId, 'quoteUpdated', {
                    id: rejected.id,
                    status: QuoteStatus.REJECTED,
                });
            }

            // Emit job status update to customer, accepted trader, and admins
            this.socketService.emitToUser(quote.job.customerId, 'jobUpdated', updatedJob);
            this.socketService.emitToUser(quote.traderId, 'jobUpdated', updatedJob);
            this.socketService.emitToRoom('admins', 'jobUpdated', updatedJob);

            this.customerDashboardService.emitDashboardUpdate(customerId);
            this.traderDashboardService.emitDashboardUpdate(quote.traderId);
            for (const rejected of txRejectedQuotes) {
                this.traderDashboardService.emitDashboardUpdate(rejected.traderId);
            }

        } catch (error) {
            this.logger.error(
                `Failed to accept quote ${quoteId}: ${error.message}`,
                error.stack,
            );
            throw error;
        }
        await this.redisService.deleteByPattern(
            `customer:jobs:${customerId}:*`,
        );
        await this.redisService.deleteByPattern('admin:quotes:*');

        return {
            message:
                'Trader selected successfully',
        };
    }

    /*
    |--------------------------------------------------------------------------
    | REJECT QUOTE
    |--------------------------------------------------------------------------
    */
    async rejectQuote(
        customerId: string,
        quoteId: string,
    ) {
        /*
        |--------------------------------------------------------------------------
        | FIND QUOTE
        |--------------------------------------------------------------------------
        */
        const quote =
            await this.prisma.quote.findUnique({
                where: {
                    id: quoteId,
                },
                include: {
                    job: true,
                    trader: true,
                },
            });

        if (!quote) {
            throw new NotFoundException(
                'Quote not found',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | AUTHORIZATION
        |--------------------------------------------------------------------------
        */

        if (quote.job.customerId !== customerId) {
            throw new BadRequestException(
                'You are not allowed to reject this quote',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | STATUS CHECK
        |--------------------------------------------------------------------------
        */
        if (quote.status !== QuoteStatus.PENDING) {
            throw new BadRequestException(
                `Quote is already ${quote.status.toLowerCase()}`,
            );
        }

        try {
            const { rejectedQuote, updatedJob } = await this.prisma.$transaction(
                async (tx) => {
                    /*
                    |--------------------------------------------------------------------------
                    | REJECT THIS QUOTE
                    |--------------------------------------------------------------------------
                    */
                    const rejectedQuote = await tx.quote.update({
                        where: {
                            id: quoteId,
                        },
                        data: {
                            status: QuoteStatus.REJECTED,
                        },
                    });

                    /*
                    |--------------------------------------------------------------------------
                    | REJECT MATCH
                    |--------------------------------------------------------------------------
                    */
                    await tx.jobTraderMatch.updateMany({
                        where: {
                            jobId: quote.jobId,
                            traderId: quote.traderId,
                        },
                        data: {
                            status: JobMatchStatus.REJECTED,
                            respondedAt: new Date(),
                        },
                    });

                    /*
                    |--------------------------------------------------------------------------
                    | UPDATE JOB QUOTE COUNT AND STATUS
                    |--------------------------------------------------------------------------
                    */
                    const newQuotesReceived = Math.max(0, quote.job.quotesReceived - 1);
                    const updatedJob = await tx.job.update({
                        where: {
                            id: quote.jobId,
                        },
                        data: {
                            quotesReceived: newQuotesReceived,
                            status: newQuotesReceived === 0 ? JobStatus.POSTED : JobStatus.QUOTE_RECEIVED,
                        },
                    });

                    return { rejectedQuote, updatedJob };
                },
            );

            // Trigger matching queue to search once again for new trader
            await this.matchingQueue.add('match-job', { jobId: quote.jobId }).catch(err => {
                this.logger.error(`Failed to add job to matching queue: ${err.message}`);
            });

            // Notify rejected trader
            this.notificationService.createNotification(
                quote.traderId,
                'Quote Rejected',
                `Your quote for "${quote.job.title}" has been rejected`,
                'QUOTE_REJECTED',
                { jobId: quote.jobId, quoteId: quoteId },
            ).catch(err => {
                this.logger.error(`Failed to notify rejected trader: ${err.message}`);
            });

            // Emit quote status update to trader
            this.socketService.emitToUser(quote.traderId, 'quoteUpdated', rejectedQuote);

            // Emit job status update to customer and admins
            this.socketService.emitToUser(quote.job.customerId, 'jobUpdated', updatedJob);
            this.socketService.emitToRoom('admins', 'jobUpdated', updatedJob);

            // Clear cache for trader
            await this.redisService.deleteByPattern(
                `trader:matched-jobs:${quote.traderId}:*`,
            );
            await this.redisService.deleteByPattern(
                `trader:quotes:${quote.traderId}:*`,
            );
            await this.redisService.del(
                `trader:quote:${quote.traderId}:job:${quote.jobId}`,
            );

            // Clear quotes cache
            await this.redisService.del(
                `job:quotes:${quote.jobId}`,
            );
            await this.redisService.deleteByPattern(
                `customer:jobs:${customerId}:*`,
            );
            await this.redisService.deleteByPattern(
                'admin:jobs:*',
            );
            await this.redisService.deleteByPattern('admin:quotes:*');

        } catch (error) {
            this.logger.error(
                `Failed to reject quote ${quoteId}: ${error.message}`,
                error.stack,
            );
            throw error;
        }

        this.customerDashboardService.emitDashboardUpdate(customerId);
        this.traderDashboardService.emitDashboardUpdate(quote.traderId);

        return {
            message: 'Quote rejected successfully',
        };
    }

    async getJobQuotes(
        customerId: string,
        jobId: string,
    ) {

        const cacheKey =
            `job:quotes:${jobId}`;

        const cached =
            await this.redisService.get(cacheKey);

        if (cached) {
            return cached;
        }
        /*
        |--------------------------------------------------------------------------
        | CHECK JOB
        |--------------------------------------------------------------------------
        */
        const job =
            await this.prisma.job.findFirst({
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
        /*
        |--------------------------------------------------------------------------
        | GET QUOTES
        |--------------------------------------------------------------------------
        */
        const quotes =
            await this.prisma.quote.findMany({
                where: {
                    jobId,
                },

                include: {
                    trader: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            profileImage: true,
                            traderProfile: {
                                select: {
                                    companyName: true,
                                    workRadius: true,
                                },
                            },
                            traderMetrics: {
                                select: {
                                    averageRating: true,
                                    totalReviews: true,
                                },
                            },
                        },
                    },
                    attachments: true,
                },

                orderBy: {
                    createdAt: 'desc',
                },
            });

        const result = {
            message:
                'Quotes fetched successfully',

            data: quotes.map(q => ({
                ...q,
                attachments: q.attachments?.map(a => ({
                    ...a,
                    url: `${process.env.APP_URL}/${a.file}`,
                })) || [],
            })),
        };

        await this.redisService.set(
            cacheKey,
            result,
            300, // 5 minutes
        );

        return result;
    }

    async getMyQuotes(
        traderId: string,
        query: GetMyQuotesDto,
    ) {

        const {
            page = 1,
            limit = 10,
        } = query;

        const skip =
            (page - 1) * limit;

        const cacheKey =
            `trader:quotes:${traderId}:${page}:${limit}`;

        const cached =
            await this.redisService.get(cacheKey);

        if (cached) {
            return cached;
        }

        const [quotes, total] =
            await Promise.all([

                this.prisma.quote.findMany({
                    where: {
                        traderId,
                    },

                    include: {
                        job: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                        attachments: true,
                    },

                    orderBy: {
                        createdAt: 'desc',
                    },

                    skip,
                    take: limit,
                }),

                this.prisma.quote.count({
                    where: {
                        traderId,
                    },
                }),
            ]);

        const result = {
            message:
                'Quotes fetched successfully',

            data: quotes.map(q => ({
                ...q,
                attachments: q.attachments?.map(a => ({
                    ...a,
                    url: `${process.env.APP_URL}/${a.file}`,
                })) || [],
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

    async getMyQuoteByJob(
        traderId: string,
        jobId: string,
    ) {
        const cacheKey =
            `trader:quote:${traderId}:job:${jobId}`;

        const cached =
            await this.redisService.get(cacheKey);

        if (cached) {
            return cached;
        }
        const quote =
            await this.prisma.quote.findFirst({
                where: {
                    traderId,
                    jobId,
                },

                include: {

                    job: {
                        select: {
                            id: true,

                            title: true,
                        },
                    },
                    attachments: true,
                },
            });

        if (!quote) {
            throw new NotFoundException(
                'Quote not found',
            );
        }

        const result = {
            message:
                'Quote fetched successfully',

            data: {
                ...quote,
                attachments: quote?.attachments?.map(a => ({
                    ...a,
                    url: `${process.env.APP_URL}/${a.file}`,
                })) || [],
            },
        };
        await this.redisService.set(
            cacheKey,
            result,
            300, // 5 minutes
        );
        return result;
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE QUOTE
    |--------------------------------------------------------------------------
    */

    async updateQuote(
        traderId: string,
        quoteId: string,
        dto: CreateQuoteDto,
        files: Express.Multer.File[] = [],
    ) {
        const quote = await this.prisma.quote.findUnique({
            where: { id: quoteId },
            include: {
                job: true,
                trader: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });

        if (!quote) {
            throw new NotFoundException('Quote not found');
        }

        if (quote.traderId !== traderId) {
            throw new ForbiddenException('You are not allowed to update this quote');
        }

        const job = quote.job;
        if (
            job.status === JobStatus.ASSIGNED ||
            job.status === JobStatus.COMPLETED ||
            job.status === JobStatus.CANCELLED
        ) {
            throw new BadRequestException('This job is no longer active or accepting quotes');
        }

        const wasRejected = quote.status === QuoteStatus.REJECTED;

        const existingAttachments = await this.prisma.quoteAttachment.findMany({
            where: { quoteId },
        });

        const { result, updatedJob } = await this.prisma.$transaction(
            async (tx) => {
                // If new attachments are uploaded, delete existing ones
                if (files && files.length > 0) {
                    await tx.quoteAttachment.deleteMany({
                        where: { quoteId },
                    });
                }

                const updatedQuote = await tx.quote.update({
                    where: { id: quoteId },
                    data: {
                        price: dto.price ?? quote.price,
                        estimatedDays: dto.estimatedDays ?? quote.estimatedDays,
                        message: dto.message ?? quote.message,
                        status: QuoteStatus.PENDING, // Reset status to PENDING
                        ...(files && files.length > 0
                            ? {
                                  attachments: {
                                      create: files.map((file) => ({
                                          file: `uploads/quotes/${file.filename}`,
                                          filename: file.originalname,
                                          mimeType: file.mimetype,
                                          size: file.size,
                                      })),
                                  },
                              }
                            : {}),
                    },
                    include: {
                        trader: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                        },
                        job: {
                            select: {
                                id: true,
                                title: true,
                                status: true,
                            },
                        },
                        attachments: true,
                    },
                });

                let updatedJob: any = null;
                if (wasRejected) {
                    // Update Match Status back to QUOTED
                    await tx.jobTraderMatch.update({
                        where: {
                            jobId_traderId: {
                                jobId: quote.jobId,
                                traderId: quote.traderId,
                            },
                        },
                        data: {
                            status: JobMatchStatus.QUOTED,
                            isQuoteSubmitted: true,
                            respondedAt: new Date(),
                        },
                    });

                    // Update Job quotes count and status
                    const newQuotesReceived = job.quotesReceived + 1;
                    updatedJob = await tx.job.update({
                        where: { id: quote.jobId },
                        data: {
                            quotesReceived: newQuotesReceived,
                            status: JobStatus.QUOTE_RECEIVED,
                        },
                    });
                }

                return { result: updatedQuote, updatedJob };
            },
        );

        // Delete previous attachments from server disk
        if (files && files.length > 0 && existingAttachments.length > 0) {
            for (const attachment of existingAttachments) {
                try {
                    const filePath = path.join(process.cwd(), attachment.file);
                    await fs.unlink(filePath);
                } catch (error) {
                    this.logger.warn(`Failed to delete quote attachment file ${attachment.file}: ${error.message}`);
                }
            }
        }

        // Clear cache
        await this.redisService.deleteByPattern(`trader:matched-jobs:${traderId}:*`);
        await this.redisService.del(`job:quotes:${quote.jobId}`);
        await this.redisService.deleteByPattern(`trader:quotes:${traderId}:*`);
        await this.redisService.del(`trader:quote:${traderId}:job:${quote.jobId}`);
        await this.redisService.deleteByPattern('admin:jobs:*');
        await this.redisService.deleteByPattern('admin:quotes:*');
        await this.redisService.deleteByPattern(`customer:jobs:${job.customerId}:*`);

        // Notify customer about the updated quote
        const notificationTitle = wasRejected ? 'Resubmitted Quote Received' : 'Quote Updated';
        const notificationBody = wasRejected
            ? `${quote.trader.fullName} has resubmitted their quote for your job: "${job.title}"`
            : `${quote.trader.fullName} has updated their quote for your job: "${job.title}"`;

        this.notificationService
            .createNotification(
                job.customerId,
                notificationTitle,
                notificationBody,
                'QUOTE_RECEIVED',
                { jobId: job.id, quoteId },
            )
            .catch((err) => {
                this.logger.error(`Failed to notify customer about quote update: ${err.message}`);
            });

        // Emit real-time updates via SocketService
        const quotePayload = {
            ...result,
            attachments:
                result?.attachments?.map((a) => ({
                    ...a,
                    url: `${process.env.APP_URL}/${a.file}`,
                })) || [],
        };

        // Notify customer UI about the new/updated quote (Quotes details page)
        this.socketService.emitToUser(job.customerId, 'newQuote', quotePayload);

        // Notify trader UI that their quote is updated/pending (My Quotes page)
        this.socketService.emitToUser(traderId, 'quoteUpdated', result);

        // Notify customer and admins about the job status/stats update (My Jobs page)
        if (updatedJob) {
            this.socketService.emitToUser(job.customerId, 'jobUpdated', updatedJob);
            this.socketService.emitToRoom('admins', 'jobUpdated', updatedJob);
        } else {
            const freshJob = await this.prisma.job.findUnique({
                where: { id: quote.jobId },
            });
            if (freshJob) {
                this.socketService.emitToUser(job.customerId, 'jobUpdated', freshJob);
                this.socketService.emitToRoom('admins', 'jobUpdated', freshJob);
            }
        }

        this.traderDashboardService.emitDashboardUpdate(traderId);
        this.customerDashboardService.emitDashboardUpdate(job.customerId);

        return {
            message: wasRejected ? 'Quote resubmitted successfully' : 'Quote updated successfully',
            data: quotePayload,
        };
    }
}