import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';

import {
    ReviewStatus,
    ReviewType,
    ReviewModerationType,
    NoWorkReason,
    ContentType,
    Prisma
} from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { RedisService } from 'src/redis/redis.service';

import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

import * as fs from 'fs';
import * as path from 'path';
import { ModerationService } from '../moderation/moderation.service';
import { GetMyReviewsDto } from './dto/get-my-review.dto';

@Injectable()
export class ReviewService {
    private readonly logger = new Logger(ReviewService.name);

    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService,
        private redisService: RedisService,
        private readonly moderationService: ModerationService,
    ) { }

    /*
    |--------------------------------------------------------------------------
    | CREATE REVIEW
    |--------------------------------------------------------------------------
    */

    async createReview(
        customerId: string,
        dto: CreateReviewDto,
        proofs: Express.Multer.File[] = [],
    ) {

        /*
        |--------------------------------------------------------------------------
        | RATE LIMIT
        |--------------------------------------------------------------------------
        */

        const key = `review:create:${customerId}`;

        const current =
            await this.redisService.incr(key);

        if (current === 1) {
            await this.redisService.expire(
                key,
                86400,
            );
        }

        if (current > 10) {
            throw new BadRequestException(
                'Daily review limit exceeded',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | JOB VALIDATION
        |--------------------------------------------------------------------------
        */

        if (dto.reviewType === ReviewType.JOB) {

            if (!dto.jobId) {
                throw new BadRequestException(
                    'Job id required',
                );
            }

            const job =
                await this.prisma.job.findUnique({
                    where: {
                        id: dto.jobId,
                    },
                });

            if (!job) {
                throw new NotFoundException(
                    'Job not found',
                );
            }

            if (job.customerId !== customerId) {
                throw new ForbiddenException(
                    'Unauthorized',
                );
            }

            const existingReview =
                await this.prisma.review.findFirst({
                    where: {
                        customerId,
                        jobId: dto.jobId,
                        reviewType: ReviewType.JOB,
                        deletedAt: null,
                    },
                });

            if (existingReview) {
                throw new BadRequestException(
                    'You already reviewed this job',
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | REVIEW SETTINGS
        |--------------------------------------------------------------------------
        */

        const workCompletedDate: Date | null =
            dto.wasWorkCompleted && dto.workCompletedDate
                ? new Date(dto.workCompletedDate)
                : null;

        const wouldRecommendTrader: boolean | null =
            dto.wasWorkCompleted
                ? dto.wouldRecommendTrader ?? null
                : null;

        const noWorkReason: NoWorkReason | null =
            !dto.wasWorkCompleted
                ? dto.noWorkReason ?? null
                : null;

        const noWorkReasonText: string | null =
            !dto.wasWorkCompleted
                ? dto.noWorkReasonText ?? null
                : null;
        const moderationType: ReviewModerationType =
            dto.reviewType === ReviewType.JOB
                ? ReviewModerationType.AUTO
                : ReviewModerationType.MANUAL;

        const status: ReviewStatus =
            dto.reviewType === ReviewType.JOB
                ? ReviewStatus.APPROVED
                : ReviewStatus.PENDING;

        const isVerified =
            dto.reviewType === ReviewType.JOB;

        /*
        |--------------------------------------------------------------------------
        | CREATE REVIEW
        |--------------------------------------------------------------------------
        */

        const review = await this.prisma.review.create({
            data: {
                customerId,
                traderId: dto.traderId,

                jobId: dto.jobId,

                reviewType: dto.reviewType,

                moderationType,

                interactionSource:
                    dto.interactionSource,

                rating: dto.rating,

                title: dto.title,

                workCompletedDate,
                wouldRecommendTrader,
                noWorkReason,
                noWorkReasonText,
                review: dto.review,

                wasWorkCompleted:
                    dto.wasWorkCompleted,

                proofRequired:
                    proofs.length > 0,

                status,

                isVerified,

                editableUntil: new Date(
                    Date.now() +
                    48 * 60 * 60 * 1000,
                ),

                reviewRequestExpiresAt: new Date(
                    Date.now() +
                    180 *
                    24 *
                    60 *
                    60 *
                    1000,
                ),

                approvedAt:
                    status === ReviewStatus.APPROVED
                        ? new Date()
                        : null,

                ...(proofs.length > 0 && {
                    proofs: {
                        create: proofs.map(file => ({
                            fileUrl: `uploads/reviews/${file.filename}`,
                            mimeType:
                                file.mimetype,
                        })),
                    },
                }),
            },

            include: {
                proofs: true,
            },
        });

        // checking violation

        if (dto.review?.trim()) {
            await this.moderationService.scanContent(
                customerId,
                dto.review,
                ContentType.REVIEW,
                review.id,
            );
        }

        if (dto.title?.trim()) {
            await this.moderationService.scanContent(
                customerId,
                dto.title,
                ContentType.REVIEW,
                review.id,
            );
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE METRICS FOR AUTO APPROVED REVIEWS
        |--------------------------------------------------------------------------
        */

        if (status === ReviewStatus.APPROVED) {
            await this.recalculateTraderMetrics(
                dto.traderId,
            );
        }


        /*
        |--------------------------------------------------------------------------
        | CLEAR CACHE
        |--------------------------------------------------------------------------
        */

        await Promise.all([
            this.redisService.del(
                `trader:summary:${dto.traderId}`,
            ),

            this.redisService.del(
                `trader:reviews:${dto.traderId}`,
            ),

            this.redisService.deleteByPattern(
                `trader:reviews:${dto.traderId}:*`,
            ),
            this.redisService.del(
                'global:average_rating',
            ),
            this.redisService.deleteByPattern(
                'reviews:pending:*',
            ),
            this.redisService.deleteByPattern(
                `trader:reviews:${review.traderId}:*`,
            ),
            this.redisService.deleteByPattern(
                `customer:reviews:${customerId}:*`,
            ),
            this.redisService.deleteByPattern(
                `review:detail:${review.id}:*`,
            ),
            this.redisService.deleteByPattern('admin:reviews:*'),
            this.redisService.deleteByPattern(`public:reviews:*`),
        ]);

        try {

            /*
            |--------------------------------------------------------------------------
            | JOB REVIEW → NOTIFY TRADER
            |--------------------------------------------------------------------------
            */

            if (dto.reviewType === ReviewType.JOB) {

                await this.notificationService.createNotification(

                    dto.traderId,

                    'New Review Received',

                    `You received a new ${dto.rating}-star review.`,

                    'REVIEW_RECEIVED',

                    {
                        reviewId: review.id,

                        jobId: dto.jobId,

                        reviewType: dto.reviewType,

                        rating: dto.rating,
                    },
                );

            } else {

                /*
                |--------------------------------------------------------------------------
                | NON-JOB REVIEW → NOTIFY ADMINS
                |--------------------------------------------------------------------------
                */

                const admins =
                    await this.prisma.user.findMany({
                        where: {
                            role: 'ADMIN',
                            status: 'ACTIVE',
                        },

                        select: {
                            id: true,
                        },
                    });

                await Promise.all(

                    admins.map((admin) =>

                        this.notificationService
                            .createNotification(

                                admin.id,

                                'Review Requires Approval',

                                `A new review has been submitted and requires moderation.`,

                                'REVIEW_PENDING_APPROVAL',

                                {
                                    reviewId: review.id,

                                    traderId: dto.traderId,

                                    reviewType: dto.reviewType,
                                },
                            )
                            .catch((err) => {

                                this.logger.error(
                                    `Failed to notify admin ${admin.id}: ${err.message}`,
                                );

                            }),
                    ),
                );
            }

        } catch (error) {

            this.logger.error(
                `Review notification failed: ${error.message}`,
            );
        }

        return {
            message:
                status === ReviewStatus.APPROVED
                    ? 'Review submitted successfully'
                    : 'Review submitted and awaiting approval',

            data: review,
        };
    }

    async recalculateTraderMetrics(
        traderId: string,
    ) {
        const reviews =
            await this.prisma.review.findMany({
                where: {
                    traderId,
                    status: ReviewStatus.APPROVED,
                    deletedAt: null,
                },
                select: {
                    rating: true,
                },
            });

        const totalReviews = reviews.length;

        const averageRating =
            totalReviews === 0
                ? 0
                : reviews.reduce(
                    (sum, review) =>
                        sum + review.rating,
                    0,
                ) / totalReviews;

        let globalAverage =
            await this.redisService.get(
                'global:average_rating',
            );

        if (!globalAverage) {
            const aggregate =
                await this.prisma.review.aggregate({
                    where: {
                        status:
                            ReviewStatus.APPROVED,
                        deletedAt: null,
                    },
                    _avg: {
                        rating: true,
                    },
                });

            globalAverage = String(
                aggregate._avg.rating || 0,
            );

            await this.redisService.set(
                'global:average_rating',
                globalAverage,
                3600,
            );
        }

        const C = Number(globalAverage);
        const R = averageRating;
        const v = totalReviews;
        const m = 10;

        const bayesianRating =
            ((v / (v + m)) * R) +
            ((m / (v + m)) * C);

        await this.prisma.traderMetrics.upsert({
            where: {
                traderId,
            },
            update: {
                totalReviews,
                averageRating,
                bayesianRating,
            },
            create: {
                traderId,
                totalReviews,
                averageRating,
                bayesianRating,
            },
        });

        await Promise.all([
            this.redisService.del(
                `trader:summary:${traderId}`,
            ),
            this.redisService.del(
                `trader:reviews:${traderId}`,
            ),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE REVIEW (within 48 hours)
    |--------------------------------------------------------------------------
    */

    async updateReview(
        customerId: string,
        reviewId: string,
        dto: UpdateReviewDto,
        proofs: Express.Multer.File[] = [],
    ) {
        /*
        |--------------------------------------------------------------------------
        | FIND REVIEW
        |--------------------------------------------------------------------------
        */
        const review = await this.prisma.review.findUnique({
            where: { id: reviewId },
            include: {
                trader: true,
                proofs: true,
            },
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        /*
        |--------------------------------------------------------------------------
        | AUTHORIZATION
        |--------------------------------------------------------------------------
        */
        if (review.customerId !== customerId) {
            throw new ForbiddenException('You can only edit your own reviews');
        }

        /*
        |--------------------------------------------------------------------------
        | CHECK EDIT WINDOW
        |--------------------------------------------------------------------------
        */
        if (review.editableUntil && new Date() > review.editableUntil) {
            throw new BadRequestException('Review edit window expired');
        }

        /*
        |--------------------------------------------------------------------------
        | DETERMINE WORK COMPLETED STATUS & FIELDS
        |--------------------------------------------------------------------------
        */
        const workCompleted = dto.wasWorkCompleted ?? review.wasWorkCompleted;

        let workCompletedDate: Date | null = review.workCompletedDate;
        let wouldRecommendTrader: boolean | null = review.wouldRecommendTrader;
        let noWorkReason = review.noWorkReason;
        let noWorkReasonText = review.noWorkReasonText;

        if (workCompleted) {
            /* ===================== WORK WAS COMPLETED ===================== */
            workCompletedDate = dto.workCompletedDate
                ? new Date(dto.workCompletedDate)
                : review.workCompletedDate;

            wouldRecommendTrader =
                dto.wouldRecommendTrader ?? review.wouldRecommendTrader;

            // Clear no-work fields
            noWorkReason = null;
            noWorkReasonText = null;

            // Validation
            if (!workCompletedDate) {
                throw new BadRequestException('Work completed date is required');
            }
            if (wouldRecommendTrader === null) {
                throw new BadRequestException('Recommendation is required');
            }
        } else {
            /* ===================== NO WORK COMPLETED ===================== */
            noWorkReason = dto.noWorkReason ?? review.noWorkReason;
            noWorkReasonText = dto.noWorkReasonText ?? review.noWorkReasonText;

            // Clear work-completed fields
            workCompletedDate = null;
            wouldRecommendTrader = null;

            // Validation
            if (!noWorkReason) {
                throw new BadRequestException('Reason is required');
            }
            if (
                noWorkReason === NoWorkReason.OTHER &&
                !noWorkReasonText
            ) {
                throw new BadRequestException('Other reason is required');
            }
        }

        /*
        |--------------------------------------------------------------------------
        | DETERMINE MODERATION STATUS
        |--------------------------------------------------------------------------
        */
        let status = review.status;
        let approvedAt = review.approvedAt;

        if (review.reviewType !== ReviewType.JOB) {
            status = ReviewStatus.PENDING;
            approvedAt = null;
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE REVIEW (Transaction)
        |--------------------------------------------------------------------------
        */
        const updatedReview = await this.prisma.$transaction(async (tx) => {
            /*
            |--------------------------------------------------------------------------
            | DELETE OLD PROOFS (if replacing)
            |--------------------------------------------------------------------------
            */
            if (dto.replaceProofs && proofs.length > 0 && review.proofs.length > 0) {
                for (const proof of review.proofs) {
                    try {
                        const filePath = path.join(process.cwd(), proof.fileUrl);
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    } catch (error) {
                        this.logger.warn(`Failed to delete proof file: ${proof.fileUrl}`);
                    }
                }

                await tx.reviewProof.deleteMany({
                    where: { reviewId: review.id },
                });
            }

            /*
            |--------------------------------------------------------------------------
            | UPDATE REVIEW
            |--------------------------------------------------------------------------
            */
            await Promise.all([
                this.redisService.del(
                    `trader:summary:${review.traderId}`,
                ),

                this.redisService.del(
                    `trader:reviews:${review.traderId}`,
                ),
                this.redisService.deleteByPattern(
                    `trader:reviews:${review.traderId}:*`,
                ),
                this.redisService.del(
                    'global:average_rating',
                ),
                this.redisService.deleteByPattern(
                    'reviews:pending:*',
                ),
                this.redisService.deleteByPattern(
                    `trader:reviews:${review.traderId}:*`,
                ),
                this.redisService.deleteByPattern(
                    `customer:reviews:${customerId}:*`,
                ),
                this.redisService.deleteByPattern(
                    `review:detail:${reviewId}:*`,
                ),
                this.redisService.deleteByPattern('admin:reviews:*'),
                this.redisService.deleteByPattern(`public:reviews:*`),
            ]);

            return await tx.review.update({
                where: { id: reviewId },
                data: {
                    rating: dto.rating ?? review.rating,
                    title: dto.title ?? review.title,
                    review: dto.review ?? review.review,

                    wasWorkCompleted: workCompleted,
                    workCompletedDate,
                    wouldRecommendTrader,
                    noWorkReason,
                    noWorkReasonText,

                    status,
                    approvedAt,

                    proofRequired: proofs.length > 0 ? true : review.proofRequired,

                    ...(proofs.length > 0 && {
                        proofs: {
                            create: proofs.map((file) => ({
                                fileUrl: `uploads/reviews/${file.filename}`,
                                mimeType: file.mimetype,
                            })),
                        },
                    }),
                },
                include: {
                    customer: {
                        select: { id: true, fullName: true },
                    },
                    trader: {
                        select: { id: true, fullName: true },
                    },
                    proofs: true,
                },
            });
        });

        /*
        |--------------------------------------------------------------------------
        | RECALCULATE METRICS
        |--------------------------------------------------------------------------
        */
        await this.recalculateTraderMetrics(review.traderId);

        /*
        |--------------------------------------------------------------------------
        | CLEAR CACHE
        |--------------------------------------------------------------------------
        */
        await Promise.all([
            this.redisService.del(`trader:summary:${review.traderId}`),
            this.redisService.del(`trader:reviews:${review.traderId}`),
            this.redisService.del('global:average_rating'),
            this.redisService.deleteByPattern(
                `trader:reviews:${review.traderId}:*`,
            ),
            this.redisService.deleteByPattern(
                `customer:reviews:${customerId}:*`,
            ),
            this.redisService.deleteByPattern(
                `review:detail:${reviewId}:*`,
            ),
            this.redisService.deleteByPattern('admin:reviews:*'),
        ]);

        /*
        |--------------------------------------------------------------------------
        | SEND NOTIFICATION (only if rating changed)
        |--------------------------------------------------------------------------
        */
        if (dto.rating !== undefined && dto.rating !== review.rating) {
            this.notificationService
                .createNotification(
                    review.traderId,
                    'Review Updated',
                    `Your review rating was updated to ${dto.rating} stars`,
                    'REVIEW_UPDATED',
                    {
                        reviewId: review.id,
                        jobId: review.jobId,
                        rating: dto.rating,
                    },
                )
                .catch((err) => {
                    this.logger.warn(`Failed to notify trader: ${err.message}`);
                });
        }

        return {
            message:
                review.reviewType === ReviewType.JOB
                    ? 'Review updated successfully'
                    : 'Review updated and awaiting approval',
            data: updatedReview,
        };
    }

    /*
    |--------------------------------------------------------------------------
    | GET TRADER REVIEWS
    |--------------------------------------------------------------------------
    */

    async getTraderReviews(
        traderId: string,
        page: number = 1,
        limit: number = 10,
    ) {
        const cacheKey =
            `trader:reviews:${traderId}:${page}:${limit}`;

        const cached =
            await this.redisService.get(cacheKey);

        if (cached) {
            return cached;
        }
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where: {
                    traderId,
                    status: ReviewStatus.APPROVED,
                    reviewRequestExpiresAt: { gt: new Date() }, // Not expired
                },
                include: {
                    customer: {
                        select: {
                            id: true,
                            fullName: true,
                            profileImage: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.review.count({
                where: {
                    traderId,
                    status: ReviewStatus.APPROVED,
                    reviewRequestExpiresAt: { gt: new Date() },
                },
            }),
        ]);

        const result = {
            message:
                'Reviews fetched successfully',

            data: reviews,

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
            300, // 5 minutes
        );

        return result;
    }

    /*
    |--------------------------------------------------------------------------
    | GET TRADER RATING SUMMARY
    |--------------------------------------------------------------------------
    */

    async getTraderRatingSummary(
        traderId: string,
    ) {
        const cacheKey =
            `trader:summary:${traderId}`;

        const cached =
            await this.redisService.get(
                cacheKey,
            );

        /*
        |--------------------------------------------------------------------------
        | RETURN CACHED DATA
        |--------------------------------------------------------------------------
        */

        if (
            cached &&
            typeof cached === 'string'
        ) {
            return JSON.parse(cached);
        }

        /*
        |--------------------------------------------------------------------------
        | GET METRICS
        |--------------------------------------------------------------------------
        */

        const metrics =
            await this.prisma.traderMetrics.findUnique({
                where: {
                    traderId,
                },
            });

        const result = {
            message:
                'Rating summary fetched successfully',

            data:
                metrics || {
                    averageRating: 0,
                    totalReviews: 0,
                    completedJobs: 0,
                    responseRate: 0,
                    bayesianRating: 0,
                },
        };

        /*
        |--------------------------------------------------------------------------
        | CACHE RESULT
        |--------------------------------------------------------------------------
        */

        await this.redisService.set(
            cacheKey,
            result,
            3600,
        );

        return result;
    }

    /*
    |--------------------------------------------------------------------------
    | GET MY REVIEWS (CUSTOMER PERSPECTIVE)
    |--------------------------------------------------------------------------
    */

    async getMyReviews(
        customerId: string,
        query: GetMyReviewsDto,
    ) {

        const {
            page = 1,
            limit = 10,
            search,
        } = query;

        const skip = (page - 1) * limit;

        const cacheKey = `customer:reviews:${customerId}:${page}:${limit}:${search || 'all'}`;

        const cached = await this.redisService.get(cacheKey);

        if (cached) {
            return cached;
        }

        const where: Prisma.ReviewWhereInput = {
            customerId,
        };

        if (search) {
            where.OR = [
                {
                    trader: {
                        fullName: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    job: {
                        title: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                },
            ];
        }

        const [reviews, total] = await this.prisma.$transaction([
            this.prisma.review.findMany({
                where,
                include: {
                    trader: {
                        select: {
                            id: true,
                            fullName: true,
                            profileImage: true,
                        },
                    },
                    job: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
            }),

            this.prisma.review.count({
                where,
            }),
        ]);

        const result = {
            message: 'Your reviews fetched successfully',
            data: reviews,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };

        await this.redisService.set(
            cacheKey,
            result,
            300,
        );

        return result;
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE REVIEW (only if pending)
    |--------------------------------------------------------------------------
    */

    async deleteReview(customerId: string, reviewId: string) {
        const review = await this.prisma.review.findUnique({
            where: { id: reviewId },
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        if (review.customerId !== customerId) {
            throw new ForbiddenException(
                'You can only delete your own reviews',
            );
        }

        if (review.status !== ReviewStatus.PENDING) {
            throw new BadRequestException(
                'Only pending reviews can be deleted',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | DELETE AND REVERT METRICS
        |--------------------------------------------------------------------------
        */

        await this.prisma.$transaction(
            async (tx) => {
                await tx.review.delete({
                    where: { id: reviewId },
                });

                const metrics = await tx.traderMetrics.findUnique({
                    where: { traderId: review.traderId },
                });

                if (metrics && metrics.totalReviews > 0) {
                    const newTotalReviews = metrics.totalReviews - 1;
                    let newAverageRating = 0;

                    if (newTotalReviews > 0) {
                        newAverageRating =
                            (metrics.averageRating * metrics.totalReviews - review.rating) /
                            newTotalReviews;
                    }

                    await tx.traderMetrics.update({
                        where: { traderId: review.traderId },
                        data: {
                            totalReviews: newTotalReviews,
                            averageRating: parseFloat(newAverageRating.toFixed(2)),
                        },
                    });
                }
            },
        );

        // Invalidate cached global average rating
        await Promise.all([
            this.redisService.del(
                `trader:summary:${review.traderId}`,
            ),

            this.redisService.del(
                `trader:reviews:${review.traderId}`,
            ),
            this.redisService.deleteByPattern(
                `trader:reviews:${review.traderId}:*`,
            ),

            this.redisService.del(
                'global:average_rating',
            ),
            this.redisService.deleteByPattern(
                'reviews:pending:*',
            ),
            this.redisService.deleteByPattern(
                `trader:reviews:${review.traderId}:*`,
            ),
            this.redisService.deleteByPattern(
                `customer:reviews:${customerId}:*`,
            ),
            this.redisService.deleteByPattern(
                `review:detail:${reviewId}:*`,
            ),
            this.redisService.deleteByPattern('admin:reviews:*'),
            this.redisService.deleteByPattern(`public:reviews:*`),
        ]);

        return {
            message: 'Review deleted successfully',
        };
    }


    async replyToReview(
        traderId: string,
        reviewId: string,
        reply: string,
    ) {

        const review =
            await this.prisma.review.findUnique({
                where: {
                    id: reviewId,
                },
            });

        if (!review) {
            throw new NotFoundException(
                'Review not found',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | OWNERSHIP CHECK
        |--------------------------------------------------------------------------
        */

        if (review.traderId !== traderId) {
            throw new ForbiddenException(
                'Unauthorized',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | PREVENT MULTIPLE REPLIES
        |--------------------------------------------------------------------------
        */

        if (review.traderReply) {
            throw new BadRequestException(
                'Reply already exists',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | OPTIONAL: ONLY APPROVED REVIEWS
        |--------------------------------------------------------------------------
        */

        if (
            review.status !== ReviewStatus.APPROVED
        ) {
            throw new BadRequestException(
                'Cannot reply to unapproved review',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | SAVE REPLY
        |--------------------------------------------------------------------------
        */

        const updated =
            await this.prisma.review.update({
                where: {
                    id: reviewId,
                },

                data: {
                    traderReply: reply,

                    traderReplyAt:
                        new Date(),
                },
            });

        /*
        |--------------------------------------------------------------------------
        | CLEAR CACHE
        |--------------------------------------------------------------------------
        */
        await Promise.all([
            this.redisService.del(
                `trader:summary:${review.traderId}`,
            ),

            this.redisService.del(
                `trader:reviews:${review.traderId}`,
            ),

            this.redisService.del(
                'global:average_rating',
            ),
            this.redisService.deleteByPattern(
                'reviews:pending:*',
            ),
            this.redisService.deleteByPattern(
                `trader:reviews:${review.traderId}:*`,
            ),

            this.redisService.deleteByPattern(
                `customer:reviews:${review.customerId}:*`,
            ),
            this.redisService.deleteByPattern(
                `review:detail:${reviewId}:*`,
            ),
            this.redisService.deleteByPattern('admin:reviews:*'),
            this.redisService.deleteByPattern(`public:reviews:*`),
        ]);

        /*
        |--------------------------------------------------------------------------
        | NOTIFY CUSTOMER
        |--------------------------------------------------------------------------
        */

        try {

            await this.notificationService.createNotification(

                review.customerId,

                'Trader Replied to Your Review',

                'A trader has replied to your review.',

                'REVIEW_REPLY',

                {
                    reviewId: review.id,

                    traderId: traderId,
                },
            );

        } catch (error) {

            this.logger.error(
                `Failed to notify customer about review reply: ${error.message}`,
            );
        }

        return {

            message:
                'Reply added successfully',

            data: updated,
        };
    }

    async getReviewById(
        userId: string,
        reviewId: string,
    ) {

        /*
        |--------------------------------------------------------------------------
        | REVIEW
        |--------------------------------------------------------------------------
        */

        const review: any =
            await this.prisma.review.findUnique({

                where: {
                    id: reviewId,
                },

                include: {

                    customer: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },

                    trader: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },

                    proofs: true,
                },
            });

        if (!review) {

            throw new NotFoundException(
                'Review not found',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | ACCESS CONTROL
        |--------------------------------------------------------------------------
        */

        const user =
            await this.prisma.user.findUnique({

                where: {
                    id: userId,
                },

                select: {
                    role: true,
                },
            });

        const isAdmin =
            user?.role === 'ADMIN';

        const isCustomer =
            review.customerId === userId;

        const isTrader =
            review.traderId === userId;

        if (
            !isAdmin &&
            !isCustomer &&
            !isTrader
        ) {

            throw new ForbiddenException(
                'Unauthorized',
            );
        }

        /*
        |--------------------------------------------------------------------------
        | CACHE
        |--------------------------------------------------------------------------
        */

        const cacheKey =
            `review:detail:${reviewId}:${userId}`;

        const cached =
            await this.redisService.get(cacheKey);

        if (cached) {
            return cached;
        }

        /*
        |--------------------------------------------------------------------------
        | FORMAT PROOFS
        |--------------------------------------------------------------------------
        */

        const formattedProofs =
            (review.proofs || []).map(
                (proof: any) => ({

                    ...proof,

                    fileUrl:
                        `${process.env.APP_URL}/${proof.fileUrl}`,
                }),
            );

        const result = {

            message:
                'Review fetched successfully',

            data: {

                ...review,

                proofs:
                    formattedProofs,
            },
        };

        await this.redisService.set(
            cacheKey,
            result,
            300, // 5 min
        );

        return result;
    }

    async getPublicReviews(
        page: number = 1,
        limit: number = 10,
    ) {
        const cacheKey = `public:reviews:${page}:${limit}`;

        const cached = await this.redisService.get(cacheKey);

        if (cached) {
            return cached;
        }

        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where: {
                    status: ReviewStatus.APPROVED,
                    reviewRequestExpiresAt: {
                        gt: new Date(),
                    },
                },
                include: {
                    customer: {
                        select: {
                            id: true,
                            fullName: true,
                            profileImage: true,
                        },
                    },
                    trader: {
                        select: {
                            id: true,
                            fullName: true,
                            profileImage: true,
                            traderProfile: {
                                select: {
                                    companyName: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.review.count({
                where: {
                    status: ReviewStatus.APPROVED,
                    reviewRequestExpiresAt: {
                        gt: new Date(),
                    },
                },
            }),
        ]);

        const result = {
            message: 'Approved reviews fetched successfully',
            data: reviews,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };

        await this.redisService.set(
            cacheKey,
            result,
            300,
        );

        return result;
    }
}
