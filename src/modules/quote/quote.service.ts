import {
    BadRequestException,
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';

import {
    JobMatchStatus,
    JobStatus,
    QuoteStatus,
} from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

import { CreateQuoteDto } from './dto/create-quote.dto';
import { RedisService } from 'src/redis/redis.service';
import { GetMyQuotesDto } from './dto/get-my-quote.dto';

@Injectable()
export class QuoteService {

    private readonly logger = new Logger(QuoteService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService,
        private redisService: RedisService,
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

                    const startOfDay = new Date();
                    startOfDay.setHours(
                        0,
                        0,
                        0,
                        0,
                    );

                    const endOfDay = new Date();
                    endOfDay.setHours(
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
        return {
            message:
                'Quote submitted successfully',

            data: result,
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
            await this.prisma.$transaction(
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

                    return { rejectedQuotes };
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
        return {
            message:
                'Trader selected successfully',
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
                        },
                    },
                },

                orderBy: {
                    createdAt: 'desc',
                },
            });

        const result = {
            message:
                'Quotes fetched successfully',

            data: quotes,
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

            data: quotes,

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

            data: quote,
        };

        await this.redisService.set(
            cacheKey,
            result,
            300, // 5 minutes
        );

        return result;
    }
}