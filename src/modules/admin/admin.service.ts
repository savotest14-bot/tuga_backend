// admin.service.ts

import {
    BadRequestException,
    Get,
    Injectable,
    Logger,
    NotFoundException,
    Param,
} from '@nestjs/common';

import {
    PrismaService,
} from 'src/prisma/prisma.service';

import {
    Prisma,
    ReviewStatus,
    Role,
    UserStatus,
    VerificationStatus,
} from '@prisma/client';

import {
    UpdateTraderVerificationDto,
} from './dto/update-trader-verification.dto';
import { MailService } from 'src/common/mail/mail.service';
import { RedisService } from 'src/redis/redis.service';
import { NotificationService } from '../notification/notification.service';
import { ReviewCategoryChangeDto } from './dto/ReviewCategoryChangeDto';
import { GetJobsDto } from './dto/get-job.dto';
import { GetManualReviewJobsDto } from './dto/get-manual-review-job.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { GetReviewsDto } from './dto/get-review.dto';
import { GetAllQuotesDto } from './dto/get-all-quote.dto';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);
    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
        private notificationService: NotificationService,
        private redisService: RedisService,
    ) { }

    // =========================
    // CUSTOMERS
    // =========================

    async getCustomers(
        page: number = 1,

        limit: number = 10,

        status?: string,

        search?: string,
    ) {

        const cacheKey =
            `customers:${page}:${limit}:${status || 'all'}:${search || 'all'}`;

        const cached =
            await this.redisService.get(
                cacheKey,
            );

        if (cached) {
            return cached;
        }

        const skip =
            (page - 1) * limit;

        const where: any = {

            role: Role.CUSTOMER,
        };

        // Status Filter (Optional)

        if (
            status &&
            status.trim() !== ''
        ) {

            where.status =
                status;
        }

        // Search Filter (Optional)

        if (
            search &&
            search.trim() !== ''
        ) {

            where.OR = [

                {
                    fullName: {
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
                    phone: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
            ];
        }

        // Get Customers

        const customers =
            await this.prisma.user.findMany({

                where,

                skip,

                take: limit,

                orderBy: {
                    createdAt: 'desc',
                },

                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    profileImage: true,
                    role: true,
                    status: true,
                    isVerified: true,
                    createdAt: true,
                }
            });

        // Total Count

        const total =
            await this.prisma.user.count({
                where,
            });

        const result = {

            success: true,

            message:
                'Customers fetched successfully',

            data: customers,

            pagination: {

                total,

                page,

                limit,

                totalPages:
                    Math.ceil(total / limit),
            },
        };

        await this.redisService.set(
            cacheKey,
            result,
            300,
        );

        return result;
    }

    // =========================
    // TRADERS
    // =========================

    async getTraders(
        page: number = 1,
        limit: number = 10,
        status?: string,
        search?: string,
    ) {

        const cacheKey =
            `traders:${page}:${limit}:${status || 'all'}:${search || 'all'}`;

        const cached =
            await this.redisService.get(
                cacheKey,
            );

        if (cached) {
            return cached;
        }

        const skip =
            (page - 1) * limit;

        const where: any = {
            role: Role.TRADER,
        };

        // Status Filter

        if (
            status &&
            status.trim() !== ''
        ) {
            where.status =
                status;
        }

        // Search Filter

        if (
            search &&
            search.trim() !== ''
        ) {

            where.OR = [

                {
                    fullName: {
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
                    phone: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
            ];
        }

        const [traders, total] =
            await Promise.all([

                this.prisma.user.findMany({

                    where,

                    skip,

                    take: limit,

                    orderBy: {
                        createdAt: 'desc',
                    },

                    select: {

                        id: true,

                        fullName: true,

                        email: true,

                        phone: true,

                        profileImage: true,

                        latitude: true,

                        longitude: true,

                        role: true,

                        status: true,

                        isVerified: true,

                        createdAt: true,

                        updatedAt: true,

                        traderProfile: {
                            select: {
                                id: true,
                                companyName: true,
                                companyType: true,
                                tradeCategories: true,
                                skillsServices: true,
                                subCategories: true,
                                workRadius: true,
                                location: true,
                                about: true,
                                logo: true,
                                document: true,
                                verificationStatus: true,
                                registrationStep: true,
                                isRegistrationCompleted: true,
                            },
                        },
                    },
                }),

                this.prisma.user.count({
                    where,
                }),
            ]);

        const formattedTraders = await Promise.all(
            traders.map(async (trader) => {
                const profile = trader.traderProfile;

                if (!profile) return trader;

                const [tradeCategories, skillsServices, subCategories] =
                    await Promise.all([
                        this.prisma.category.findMany({
                            where: {
                                id: {
                                    in: profile.tradeCategories,
                                },
                            },
                            select: {
                                id: true,
                                name: true,
                            },
                        }),

                        this.prisma.skillService.findMany({
                            where: {
                                id: {
                                    in: profile.skillsServices,
                                },
                            },
                            select: {
                                id: true,
                                name: true,
                            },
                        }),

                        this.prisma.subCategory.findMany({
                            where: {
                                id: {
                                    in: profile.subCategories,
                                },
                            },
                            select: {
                                id: true,
                                name: true,
                            },
                        }),
                    ]);

                return {
                    ...trader,
                    traderProfile: {
                        ...profile,
                        tradeCategories,
                        skillsServices,
                        subCategories,
                    },
                };
            }),
        );

        const result = {

            success: true,

            message:
                'Traders fetched successfully',

            data: formattedTraders,

            pagination: {

                total,

                page,

                limit,

                totalPages:
                    Math.ceil(
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

    async verifyTrader(
        traderId: string,
        body: UpdateTraderVerificationDto,
    ) {
        const { verificationStatus, rejectReason } = body;

        // Find Trader
        const trader = await this.prisma.user.findUnique({
            where: {
                id: traderId,
            },
            include: {
                traderProfile: true,
            },
        });

        if (!trader) {
            throw new BadRequestException('Trader not found');
        }

        if (trader.role !== Role.TRADER) {
            throw new BadRequestException('User is not a trader');
        }

        // Reject reason required for Manual Check & Rejected
        const requiredReasonStatuses: VerificationStatus[] = [
            VerificationStatus.REJECTED,
            VerificationStatus.MANUAL_CHECK,
        ];

        if (
            requiredReasonStatuses.includes(verificationStatus) &&
            !rejectReason
        ) {
            throw new BadRequestException(
                'Reason is required',
            );
        }

        // Update Trader
        const updatedTrader = await this.prisma.user.update({
            where: {
                id: traderId,
            },
            data: {
                isVerified:
                    verificationStatus === VerificationStatus.APPROVED,

                status: UserStatus.ACTIVE,

                traderProfile: {
                    update: {
                        verificationStatus,
                        rejectReason:
                            verificationStatus === VerificationStatus.APPROVED
                                ? null
                                : rejectReason,
                    },
                },
            },
            include: {
                traderProfile: true,
            },
        });

        // ===========================
        // Send Email
        // ===========================

        switch (verificationStatus) {
            case VerificationStatus.APPROVED:
                await this.mailService.sendMail({
                    to: trader.email,
                    subject: 'Trader Verification Approved',
                    html: `
          <div style="font-family:Arial,sans-serif;padding:20px;">
            <h2>Congratulations 🎉</h2>

            <p>Your trader account has been <b>approved</b>.</p>

            <p>
              You can now login and continue your subscription process.
            </p>

            <br/>

            <p>
              Thanks,<br/>
              <strong>Tuga Traders Team</strong>
            </p>
          </div>
        `,
                });
                break;

            case VerificationStatus.MANUAL_CHECK:
                await this.mailService.sendMail({
                    to: trader.email,
                    subject: 'Additional Information Required for Trader Verification',
                    html: `
          <div style="font-family:Arial,sans-serif;padding:20px;">

            <h2>Additional Information Required</h2>

            <p>
              Thank you for submitting your trader verification request.
            </p>

            <p>
              Our verification team reviewed your application and requires some additional information before we can complete the verification process.
            </p>

            <p><strong>Reason:</strong></p>

            <div style="background:#f5f5f5;padding:12px;border-radius:6px;">
              ${rejectReason}
            </div>

            <p style="margin-top:20px;">
              Please login to your account, update the requested information,
              and resubmit your verification documents.
            </p>

            <p>
              If you have any questions, feel free to contact our support team.
            </p>

            <br/>

            <p>
              Thanks,<br/>
              <strong>Tuga Traders Team</strong>
            </p>

          </div>
        `,
                });
                break;

            case VerificationStatus.REJECTED:
                await this.mailService.sendMail({
                    to: trader.email,
                    subject: 'Trader Verification Rejected',
                    html: `
          <div style="font-family:Arial,sans-serif;padding:20px;">

            <h2>Verification Rejected</h2>

            <p>
              Your trader verification request has been rejected.
            </p>

            <p><strong>Reason:</strong></p>

            <div style="background:#f5f5f5;padding:12px;border-radius:6px;">
              ${rejectReason}
            </div>

            <p style="margin-top:20px;">
              Please update the required information and submit your verification again.
            </p>

            <br/>

            <p>
              Thanks,<br/>
              <strong>Tuga Traders Team</strong>
            </p>

          </div>
        `,
                });
                break;
        }

        // ===========================
        // Redis Cleanup
        // ===========================

        await Promise.all([
            this.redisService.del(`admin:user-details:${traderId}`),
            this.redisService.del(`profile:${traderId}`),
            this.redisService.del(`registration-status:${traderId}`),
            this.redisService.deleteByPattern('traders:*'),
        ]);

        let message = '';

        switch (verificationStatus) {
            case VerificationStatus.APPROVED:
                message = 'Trader approved successfully';
                break;

            case VerificationStatus.MANUAL_CHECK:
                message = 'Trader marked for manual verification successfully';
                break;

            case VerificationStatus.REJECTED:
                message = 'Trader rejected successfully';
                break;
        }

        return {
            success: true,
            message,
            data: updatedTrader,
        };
    }

    /*
       |--------------------------------------------------------------------------
       | APPROVE REVIEW (Admin/System)
       |--------------------------------------------------------------------------
       */

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
            await this.redisService.deleteByPattern(
                'reviews:pending:*',
            ),
        ]);
    }

    async getPendingReviews(
        page: number = 1,
        limit: number = 10,
    ) {

        const cacheKey =
            `reviews:pending:${page}:${limit}`;

        const cached =
            await this.redisService.get(
                cacheKey,
            );

        if (cached) {
            return cached;
        }

        /*
        |--------------------------------------------------------------------------
        | PAGINATION
        |--------------------------------------------------------------------------
        */

        const skip =
            (page - 1) * limit;

        /*
        |--------------------------------------------------------------------------
        | TOTAL COUNT
        |--------------------------------------------------------------------------
        */

        const total =
            await this.prisma.review.count({

                where: {
                    status: 'PENDING',
                    deletedAt: null,
                },
            });

        /*
        |--------------------------------------------------------------------------
        | REVIEWS
        |--------------------------------------------------------------------------
        */

        const reviews =
            await this.prisma.review.findMany({

                where: {
                    status: 'PENDING',
                    deletedAt: null,
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

                orderBy: {
                    createdAt: 'desc',
                },

                skip,

                take: limit,
            });

        const result = {

            message:
                'Pending reviews fetched successfully',

            data:
                reviews.map((review) => ({

                    ...review,

                    proofs:
                        review.proofs.map(
                            (proof) => ({
                                ...proof,

                                fileUrl:
                                    `${process.env.APP_URL}/${proof.fileUrl}`,
                            }),
                        ),
                })),

            pagination: {

                total,

                page,

                limit,

                totalPages:
                    Math.ceil(
                        total / limit,
                    ),

                hasNextPage:
                    page <
                    Math.ceil(
                        total / limit,
                    ),

                hasPreviousPage:
                    page > 1,
            },
        };

        await this.redisService.set(
            cacheKey,
            result,
            300, // 5 min
        );

        return result;
    }

    async approveReview(
        reviewId: string,
        adminId: string,
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
        if (
            review.status ===
            ReviewStatus.APPROVED
        ) {
            throw new BadRequestException(
                'Review already approved',
            );
        }
        const approved =
            await this.prisma.review.update({
                where: {
                    id: reviewId,
                },

                data: {
                    status:
                        ReviewStatus.APPROVED,

                    approvedAt: new Date(),

                    approvedBy: adminId,
                },
            });

        await this.recalculateTraderMetrics(
            review.traderId,
        );

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
            await this.redisService.deleteByPattern(
                'reviews:pending:*',
            ),
            this.redisService.deleteByPattern(
                `trader:reviews:${review.traderId}:*`,
            ),
            this.redisService.del(
                `customer:reviews:${review.customerId}`,
            ),
            this.redisService.deleteByPattern(
                `review:detail:${reviewId}:*`,
            ),
            this.redisService.deleteByPattern('admin:reviews:*'),
            this.redisService.deleteByPattern(`public:reviews:*`),
        ]);

        try {

            /*
            |--------------------------------------------------------------------------
            | NOTIFY TRADER
            |--------------------------------------------------------------------------
            */

            await this.notificationService.createNotification(

                review.traderId,

                'Review Approved',

                'A customer review has been approved and published on your profile.',

                'REVIEW_APPROVED',

                {
                    reviewId: review.id,

                    rating: review.rating,

                    reviewType: review.reviewType,
                },
            );

            /*
            |--------------------------------------------------------------------------
            | NOTIFY CUSTOMER
            |--------------------------------------------------------------------------
            */

            await this.notificationService.createNotification(

                review.customerId,

                'Review Approved',

                'Your review has been approved and published successfully.',

                'REVIEW_APPROVED',

                {
                    reviewId: review.id,

                    traderId: review.traderId,

                    reviewType: review.reviewType,
                },
            );

        } catch (error) {

            this.logger.error(
                `Review approval notification failed: ${error.message}`,
            );
        }

        return {
            message:
                'Review approved successfully',
            data: approved,
        };
    }

    async reviewCategoryChangeRequest(
        requestId: string,
        adminId: string,
        dto: ReviewCategoryChangeDto,
    ) {
        const { action, rejectReason } = dto;

        if (
            action === 'REJECT' &&
            !rejectReason
        ) {
            throw new BadRequestException(
                'Reject reason is required when rejecting a request',
            );
        }

        const result =
            await this.prisma.$transaction(
                async (tx) => {

                    const request =
                        await tx.traderCategoryChangeRequest.findUnique(
                            {
                                where: {
                                    id: requestId,
                                },

                                include: {
                                    traderProfile: {
                                        include: {
                                            user: true,
                                        },
                                    },
                                },
                            },
                        );

                    if (!request) {
                        throw new NotFoundException(
                            'Category change request not found',
                        );
                    }

                    if (
                        request.status !==
                        'PENDING'
                    ) {
                        throw new BadRequestException(
                            'Request has already been processed',
                        );
                    }

                    const traderProfile =
                        request.traderProfile;

                    if (
                        action === 'APPROVE'
                    ) {

                        /*
                        |--------------------------------------------------------------------------
                        | APPLY CATEGORY CHANGES
                        |--------------------------------------------------------------------------
                        */

                        const subscription =
                            await tx.subscription.findUnique({
                                where: {
                                    traderProfileId:
                                        traderProfile.id,
                                },
                                include: {
                                    plan: true,
                                },
                            });

                        if (!subscription?.plan) {
                            throw new BadRequestException(
                                'No active subscription plan found',
                            );
                        }

                        const tradeCategories =
                            Array.isArray(request.tradeCategories)
                                ? [...new Set(request.tradeCategories as string[])]
                                : [];

                        if (
                            !subscription.plan.unlimitedTrades &&
                            tradeCategories.length >
                            subscription.plan.maxTrades
                        ) {
                            throw new BadRequestException(
                                `Trader's ${subscription.plan.name} plan allows only ${subscription.plan.maxTrades} trade categories`,
                            );
                        }

                        const skillsServices =
                            Array.isArray(request.skillsServices)
                                ? (request.skillsServices as string[])
                                : [];

                        const subCategories =
                            Array.isArray(request.subCategories)
                                ? (request.subCategories as string[])
                                : [];

                        await tx.traderProfile.update({
                            where: {
                                id: traderProfile.id,
                            },

                            data: {
                                tradeCategories,
                                skillsServices,
                                subCategories,
                            },
                        });

                        /*
                        |--------------------------------------------------------------------------
                        | UPDATE REQUEST STATUS
                        |--------------------------------------------------------------------------
                        */

                        await tx.traderCategoryChangeRequest.update(
                            {
                                where: {
                                    id: requestId,
                                },

                                data: {
                                    status:
                                        'APPROVED',

                                    reviewedAt:
                                        new Date(),

                                    reviewedBy:
                                        adminId,

                                    rejectReason:
                                        null,
                                },
                            },
                        );
                    } else {

                        /*
                        |--------------------------------------------------------------------------
                        | REJECT REQUEST
                        |--------------------------------------------------------------------------
                        */

                        await tx.traderCategoryChangeRequest.update(
                            {
                                where: {
                                    id: requestId,
                                },

                                data: {
                                    status:
                                        'REJECTED',

                                    reviewedAt:
                                        new Date(),

                                    reviewedBy:
                                        adminId,

                                    rejectReason:
                                        rejectReason,
                                },
                            },
                        );
                    }

                    return {
                        traderUserId:
                            traderProfile.userId,

                        requestId,

                        action,

                        rejectReason,
                    };
                },
            );

        /*
        |--------------------------------------------------------------------------
        | SEND NOTIFICATION
        |--------------------------------------------------------------------------
        */

        const notificationTitle =
            result.action === 'APPROVE'
                ? 'Category Change Approved'
                : 'Category Change Rejected';

        const notificationMessage =
            result.action === 'APPROVE'
                ? 'Your category change request has been approved successfully.'
                : `Your category change request was rejected. Reason: ${result.rejectReason}`;

        await this.notificationService.createNotification(
            result.traderUserId,
            notificationTitle,
            notificationMessage,
            result.action === 'APPROVE'
                ? 'TRADER_CATEGORY_APPROVED'
                : 'TRADER_CATEGORY_REJECTED',
            {
                requestId: result.requestId,
                action: result.action,
            },
        );

        // redis cleanup
        await Promise.all([
            this.redisService.deleteByPattern(
                'admin:category-change-requests:*',
            ),
            this.redisService.del(
                `admin:user-details:${result.traderUserId}`,
            )
        ]);

        return {
            message: `Category change request ${result.action.toLowerCase()}ed successfully`,
            requestId: result.requestId,
            status: result.action,
        };
    }

    async getCategoryChangeRequests(
        page = 1,
        limit = 10,
        status?: string,
    ) {

        page = Number(page) || 1;
        limit = Number(limit) || 10;

        const skip =
            (page - 1) * limit;

        const cacheKey =
            `admin:category-change-requests:${status || 'ALL'}:${page}:${limit}`;

        const cached =
            await this.redisService.get(
                cacheKey,
            );

        if (cached) {
            return cached;
        }

        const where =
            status
                ? {
                    status: status as any,
                }
                : {};

        const [requests, total] =
            await Promise.all([
                this.prisma.traderCategoryChangeRequest.findMany(
                    {
                        where,

                        include: {
                            traderProfile: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            fullName: true,
                                            email: true,
                                            phone: true,
                                        },
                                    },
                                },
                            },

                            admin: {
                                select: {
                                    id: true,
                                    fullName: true,
                                },
                            },
                        },

                        orderBy: {
                            createdAt: 'desc',
                        },

                        skip,
                        take: limit,
                    },
                ),

                this.prisma.traderCategoryChangeRequest.count(
                    {
                        where,
                    },
                ),
            ]);

        const response = {
            data: requests,

            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(
                    total / limit,
                ),
                hasNextPage:
                    page <
                    Math.ceil(
                        total / limit,
                    ),
                hasPreviousPage:
                    page > 1,
            },
        };

        await this.redisService.set(
            cacheKey,
            response,
            300, // 5 minutes
        );

        return response;
    }

    async getUserDetails(
        userId: string,
    ) {
        const cacheKey =
            `admin:user-details:${userId}`;

        const cached =
            await this.redisService.get(
                cacheKey,
            );

        if (cached) {
            return cached;
        }

        const user =
            await this.prisma.user.findUnique({
                where: {
                    id: userId,
                },

                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    profileImage: true,
                    latitude: true,
                    longitude: true,
                    role: true,
                    status: true,
                    isVerified: true,
                    acceptedTerms: true,
                    createdAt: true,
                    updatedAt: true,
                    isOnline: true,
                    lastSeen: true,

                    traderProfile: {
                        include: {
                            subscription: {
                                include: {
                                    plan: true,
                                    price: true,
                                },
                            },

                            portfolioItems: true,
                            certificates: true,
                            insuranceDocuments: true,

                            categoryChangeRequests: {
                                include: {
                                    admin: {
                                        select: {
                                            id: true,
                                            fullName: true,
                                        },
                                    },
                                },

                                orderBy: {
                                    createdAt: 'desc',
                                },
                            },
                        },
                    },

                    traderMetrics: true,

                    customerReviews: true,

                    traderReviews: true,

                    savedTraders: true,

                    savedByCustomers: true,
                },
            });

        if (!user) {
            throw new NotFoundException(
                'User not found',
            );
        }

        if (user.traderProfile) {

            const [
                categories,
                services,
                subCategories,
            ] = await Promise.all([

                this.prisma.category.findMany({
                    where: {
                        id: {
                            in:
                                user.traderProfile
                                    .tradeCategories,
                        },
                    },

                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                }),

                this.prisma.skillService.findMany({
                    where: {
                        id: {
                            in:
                                user.traderProfile
                                    .skillsServices,
                        },
                    },

                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                }),

                this.prisma.subCategory.findMany({
                    where: {
                        id: {
                            in:
                                user.traderProfile
                                    .subCategories,
                        },
                    },

                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                }),
            ]);

            (user.traderProfile as any)
                .tradeCategories =
                categories;

            (user.traderProfile as any)
                .skillsServices =
                services;

            (user.traderProfile as any)
                .subCategories =
                subCategories;
        }

        if (
            user?.traderProfile?.categoryChangeRequests?.length
        ) {

            for (const request of user.traderProfile.categoryChangeRequests) {

                const [
                    categories,
                    services,
                    subCategories,
                ] = await Promise.all([

                    this.prisma.category.findMany({
                        where: {
                            id: {
                                in: Array.isArray(request.tradeCategories)
                                    ? request.tradeCategories as string[]
                                    : [],
                            },
                        },

                        select: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    }),

                    this.prisma.skillService.findMany({
                        where: {
                            id: {
                                in: Array.isArray(request.skillsServices)
                                    ? request.skillsServices as string[]
                                    : [],
                            },
                        },

                        select: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    }),

                    this.prisma.subCategory.findMany({
                        where: {
                            id: {
                                in: Array.isArray(request.subCategories)
                                    ? request.subCategories as string[]
                                    : [],
                            },
                        },

                        select: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    }),
                ]);

                (request as any).tradeCategories =
                    categories;

                (request as any).skillsServices =
                    services;

                (request as any).subCategories =
                    subCategories;
            }
        }

        await this.redisService.set(
            cacheKey,
            user,
            300,
        );

        return user;
    }

    async getAllJobs(
        query: GetJobsDto,
    ) {

        const {
            page = 1,
            limit = 10,
            status,
        } = query;

        const skip =
            (page - 1) * limit;

        const cacheKey =
            `admin:jobs:${page}:${limit}:${status || 'all'}`;

        const cached =
            await this.redisService.get(
                cacheKey,
            );

        if (cached) {
            return cached;
        }

        const where: any = {};

        if (status) {
            where.status = status;
        }

        const [jobs, total] =
            await Promise.all([

                this.prisma.job.findMany({
                    where,

                    include: {

                        customer: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                phone: true,
                            },
                        },

                        category: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },

                        subCategory: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },

                        skillService: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },

                        selectedTrader: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                        },

                        attachments: true,

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
            message:
                'Jobs fetched successfully',

            data: jobs.map((job) => ({
                ...job,
                quotesCount:
                    job._count.quotes,
            })),

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

    async getJobDetails(id: string) {
        const cacheKey = `admin:job:${id}`;

        const cached = await this.redisService.get(cacheKey);

        if (cached) {
            return cached;
        }

        const job = await this.prisma.job.findUnique({
            where: { id },

            include: {
                customer: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        profileImage: true,
                        createdAt: true,
                    },
                },

                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },

                subCategory: {
                    select: {
                        id: true,
                        name: true,
                    },
                },

                skillService: {
                    select: {
                        id: true,
                        name: true,
                    },
                },

                selectedTrader: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        profileImage: true,
                    },
                },

                attachments: true,

                traderMatches: {
                    include: {
                        trader: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                phone: true,
                                profileImage: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },

                quotes: {
                    include: {
                        trader: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                phone: true,
                                profileImage: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },

                conversations: {
                    select: {
                        id: true,
                        createdAt: true,
                    },
                },

                reviews: {
                    include: {
                        customer: {
                            select: {
                                id: true,
                                fullName: true,
                            },
                        },
                        trader: {
                            select: {
                                id: true,
                                fullName: true,
                            },
                        },
                    },
                },

                escalationLogs: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                },

                _count: {
                    select: {
                        quotes: true,
                        traderMatches: true,
                        conversations: true,
                        reviews: true,
                        attachments: true,
                    },
                },
            },
        });

        if (!job) {
            throw new NotFoundException('Job not found');
        }

        const result = {
            message: 'Job details fetched successfully',

            data: {
                ...job,

                counts: {
                    quotes: job._count.quotes,
                    traderMatches: job._count.traderMatches,
                    conversations: job._count.conversations,
                    reviews: job._count.reviews,
                    attachments: job._count.attachments,
                },
            },
        };

        await this.redisService.set(cacheKey, result, 300);

        return result;
    }

    async getAllReviews(query: GetReviewsDto) {
        const {
            page = 1,
            limit = 10,
            status,
            reviewType,
            moderationType,
        } = query;

        const skip = (page - 1) * limit;

        const cacheKey = `admin:reviews:${page}:${limit}:${status ?? 'all'}:${reviewType ?? 'all'}:${moderationType ?? 'all'}`;

        const cached = await this.redisService.get(cacheKey);

        if (cached) {
            return cached;
        }

        const where: any = {
            deletedAt: null,
        };

        if (status) {
            where.status = status;
        }

        if (reviewType) {
            where.reviewType = reviewType;
        }

        if (moderationType) {
            where.moderationType = moderationType;
        }

        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where,

                include: {
                    customer: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            phone: true,
                            profileImage: true,
                        },
                    },

                    trader: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            phone: true,
                            profileImage: true,
                        },
                    },

                    job: {
                        select: {
                            id: true,
                            title: true,
                            status: true,

                            category: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },

                    proofs: true,
                },

                orderBy: {
                    createdAt: 'desc',
                },

                skip,
                take: limit,
            }),

            this.prisma.review.count({
                where,
            }),
        ]);

        const result = {
            message: 'Reviews fetched successfully',

            data: reviews.map((review) => ({
                ...review,

                proofs: review.proofs.map((proof) => ({
                    ...proof,
                    url: `${process.env.APP_URL}/${proof.fileUrl}`,
                })),
            })),

            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };

        await this.redisService.set(cacheKey, result, 300);

        return result;
    }

    async getManualReviewJobs(
        query: GetManualReviewJobsDto,
    ) {

        const {
            page = 1,
            limit = 10,
        } = query;

        const skip =
            (page - 1) * limit;

        const cacheKey =
            `admin:manual-review-jobs:${page}:${limit}`;

        const cached =
            await this.redisService.get(
                cacheKey,
            );

        if (cached) {
            return cached;
        }

        const where = {
            distributionStatus:
                'MANUAL_REVIEW' as const,
        };

        const [jobs, total] =
            await Promise.all([

                this.prisma.job.findMany({

                    where,

                    include: {

                        customer: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                phone: true,
                            },
                        },

                        category: true,

                        subCategory: true,

                        skillService: true,

                        attachments: true,

                        _count: {
                            select: {
                                quotes: true,
                            },
                        },
                    },

                    orderBy: {
                        updatedAt: 'desc',
                    },

                    skip,
                    take: limit,
                }),

                this.prisma.job.count({
                    where,
                }),
            ]);

        const result = {

            message:
                'Manual review jobs fetched successfully',

            data: jobs.map((job) => ({
                ...job,

                attachments:
                    job.attachments.map(
                        (attachment) => ({
                            ...attachment,

                            url:
                                `${process.env.APP_URL}/${attachment.file}`,
                        }),
                    ),

                quotesCount:
                    job._count.quotes,
            })),

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
            300, // 5 min
        );

        return result;
    }

    async distributeManually(
        adminId: string,
        jobId: string,
        traderIds: string[],
    ) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
        });

        if (!job) {
            throw new NotFoundException(
                'Job not found',
            );
        }

        const existingMatches =
            await this.prisma.jobTraderMatch.findMany({
                where: {
                    jobId,
                    traderId: {
                        in: traderIds,
                    },
                },
                select: {
                    traderId: true,
                },
            });

        const existingTraderIds =
            new Set(
                existingMatches.map(
                    match => match.traderId,
                ),
            );

        const newTraderIds =
            traderIds.filter(
                id => !existingTraderIds.has(id),
            );

        if (newTraderIds.length) {

            const transactionOperations: Prisma.PrismaPromise<any>[] = [];

            for (const traderId of newTraderIds) {

                /*
                |--------------------------------------------------------------------------
                | CREATE MATCH
                |--------------------------------------------------------------------------
                */

                transactionOperations.push(
                    this.prisma.jobTraderMatch.create({
                        data: {
                            jobId,
                            traderId,
                            radiusKm: job.currentRadiusKm,
                            score: 1,
                        },
                    }),
                );

                /*
                |--------------------------------------------------------------------------
                | UPDATE TRADER METRICS
                |--------------------------------------------------------------------------
                */

                transactionOperations.push(
                    this.prisma.traderMetrics.upsert({
                        where: {
                            traderId,
                        },

                        create: {
                            traderId,
                            invitesCount: 1,
                            recentLeads: 1,
                            totalMatchedJobs: 1,
                            responseRate: 0,
                            averageRating: 0,
                            totalReviews: 0,
                            completedJobs: 0,
                        },

                        update: {
                            invitesCount: {
                                increment: 1,
                            },

                            recentLeads: {
                                increment: 1,
                            },

                            totalMatchedJobs: {
                                increment: 1,
                            },
                        },
                    }),
                );
            }

            /*
            |--------------------------------------------------------------------------
            | TRANSACTION
            |--------------------------------------------------------------------------
            */

            await this.prisma.$transaction(
                transactionOperations,
            );

            /*
            |--------------------------------------------------------------------------
            | NOTIFICATIONS
            |--------------------------------------------------------------------------
            */

            await Promise.all(
                newTraderIds.map((traderId) =>
                    this.notificationService.createNotification(
                        traderId,
                        'New Job Available',
                        `${job.title} has been manually assigned by admin.`,
                        'ADMIN_ASSIGNED_JOB',
                        {
                            jobId,
                            assignedBy: 'ADMIN',
                        },
                    ),
                ),
            );

            /*
            |--------------------------------------------------------------------------
            | CLEAR TRADER CACHE
            |--------------------------------------------------------------------------
            */

            await Promise.all(
                newTraderIds.map((traderId) =>
                    this.redisService.deleteByPattern(
                        `trader:matched-jobs:${traderId}:*`,
                    ),
                ),
            );

            /*
            |--------------------------------------------------------------------------
            | ADMIN LOG
            |--------------------------------------------------------------------------
            */

            await this.prisma.adminJobActionLog.create({
                data: {
                    jobId,
                    adminId,
                    action: 'MANUAL_DISTRIBUTION',

                    metadata: {
                        requestedTraderIds: traderIds,
                        assignedTraderIds: newTraderIds,
                        skippedTraderIds: [...existingTraderIds],
                        assignedCount: newTraderIds.length,
                    },
                },
            });
        }

        await this.prisma.job.update({
            where: { id: jobId },
            data: {
                distributionStatus:
                    'MANUAL_DISTRIBUTION',
            },
        });
        await this.redisService.deleteByPattern(
            'admin:manual-review-jobs:*',
        );
        await this.redisService.deleteByPattern(
            `customer:jobs:${job.customerId}:*`,
        );
        await this.redisService.deleteByPattern(
            'admin:jobs:*',
        );
        await this.redisService.del(`admin:job:${jobId}`);

        return {
            message: 'Job distributed successfully',
            assignedCount: newTraderIds.length,
        };
    }

    async getSuggestedTraders(
        jobId: string,
        limit = 50,
        radius?: number,
    ) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
        });
        if (!job) {
            throw new NotFoundException('Job not found');
        }

        const searchRadiusKm =
            radius ?? job.currentRadiusKm;

        if (!job.latitude || !job.longitude) {
            throw new BadRequestException(
                'Job location is missing',
            );
        }
        const cacheKey = 'global:average_rating';

        let globalAverageRating =
            await this.redisService.get<number>(
                cacheKey,
            );

        if (globalAverageRating === null) {
            const metrics =
                await this.prisma.traderMetrics.aggregate({
                    _avg: {
                        averageRating: true,
                    },
                });

            globalAverageRating =
                metrics._avg.averageRating || 0;

            await this.redisService.set(
                cacheKey,
                globalAverageRating,
                3600,
            );
        }
        // same conditions from matchAndSendJob()
        const conditions: Prisma.Sql[] = [
            Prisma.sql`u.role = 'TRADER'`,
            Prisma.sql`u.status = 'ACTIVE'`,
            Prisma.sql`tp."isVisible" = true`,
            Prisma.sql`tp."verificationStatus" = 'APPROVED'`,
            Prisma.sql`tp."subscriptionStatus" IN ('TRIAL', 'ACTIVE')`,
            Prisma.sql`u.location IS NOT NULL`,
            Prisma.sql`${job.categoryId} = ANY(tp."tradeCategories")`,
            Prisma.sql`${job.skillServiceId} = ANY(tp."skillsServices")`,
            Prisma.sql`ST_DWithin(
      u.location,
      ST_SetSRID(
        ST_MakePoint(${job.longitude}, ${job.latitude}),
        4326
      )::geography,
      ${searchRadiusKm * 1000}
    )`,
        ];

        if (job.subCategoryId) {
            conditions.push(
                Prisma.sql`${job.subCategoryId} = ANY(tp."subCategories")`,
            );
        }

        const whereClause = Prisma.sql`
    WHERE ${Prisma.join(
            conditions,
            ' AND ',
        )}
  `;
        const scoredTraders = await this.prisma.$queryRaw<any[]>(
            Prisma.sql`
                SELECT 
                  u.id AS "traderId",
                  u.email,
                  u."fullName",
                  u."profileImage",
                  tm."totalReviews",
                  tm."averageRating",
                  sp."featuredAtTop",
                  (ST_Distance(u.location, ST_SetSRID(ST_MakePoint(${job.longitude}, ${job.latitude}), 4326)::geography) / 1000) AS "distanceKm",
                  GREATEST(0.0, LEAST(1.0, (
                    -- Proximity score (weight 0.30)
                    0.30 * GREATEST(0.0, 1 - (ST_Distance(u.location, ST_SetSRID(ST_MakePoint(${job.longitude}, ${job.latitude}), 4326)::geography) / 1000 / ${searchRadiusKm})) +
                    
                    -- Bayesian rating (weight 0.25)
                    0.25 * COALESCE(
                      ((COALESCE(tm."totalReviews", 0)::double precision / (COALESCE(tm."totalReviews", 0) + 10)::double precision) * COALESCE(tm."averageRating", 0) +
                      (10::double precision / (COALESCE(tm."totalReviews", 0) + 10)::double precision) * ${globalAverageRating}) / 5.0, 0.0
                    ) +
                    
                    -- Response rate (weight 0.20)
                    0.20 * COALESCE(tm."responseRate", 0.0) +
                    
                    -- Fairness score (weight 0.15)
                    0.15 * (1.0 - LEAST(1.0, COALESCE(tm."recentLeads", 0)::double precision / 50.0)) +
                    
                    -- New trader boost (weight 0.15, applies if totalMatchedJobs < 8)
                    CASE WHEN COALESCE(tm."totalMatchedJobs", 0) < 8 THEN 0.15 ELSE 0.0 END
                    -- Small random factor to add variability
                    + (RANDOM() * 0.03) 
                  ))) AS "finalScore"
                FROM "User" u
                INNER JOIN "TraderProfile" tp ON tp."userId" = u.id
                LEFT JOIN "TraderMetrics" tm ON tm."traderId" = u.id
                LEFT JOIN "Subscription" s
                ON s."traderProfileId" = tp.id
                LEFT JOIN "SubscriptionPlan" sp
                ON sp.id = s."planId"
                ${whereClause}
                ORDER BY
                COALESCE(sp."featuredAtTop", false) DESC,
        
                CASE
                  WHEN sp."exposureLevel" = 'MAXIMUM' THEN 3
                  WHEN sp."exposureLevel" = 'INCREASED' THEN 2
                  ELSE 1
                END DESC,
        
               "finalScore" DESC,
        
                COALESCE(tm."totalReviews", 0) DESC,
        
                COALESCE(tm."responseRate", 0) DESC,
        
               "distanceKm" ASC
                LIMIT ${limit}
                `
        );

        if (scoredTraders.length === 0) {
            this.logger.log(`No matching traders found within ${searchRadiusKm}km for job ${jobId}`);
            return [];
        }
        return scoredTraders

    }

    async getAllQuotes(
        query: GetAllQuotesDto,
    ) {
        const {
            page = 1,
            limit = 10,
            status,
        } = query;

        const skip = (page - 1) * limit;

        const cacheKey = `admin:quotes:${page}:${limit}:${status ?? 'all'}`;

        const cached = await this.redisService.get(cacheKey);

        if (cached) {
            return cached;
        }

        const where: any = {};

        if (status) {
            where.status = status;
        }

        const [quotes, total] = await Promise.all([
            this.prisma.quote.findMany({
                where,

                include: {
                    trader: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            phone: true,
                            profileImage: true,
                        },
                    },

                    job: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                            budgetRange: true,
                            createdAt: true,

                            customer: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    email: true,
                                    phone: true,
                                },
                            },

                            category: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },

                            subCategory: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },

                            skillService: {
                                select: {
                                    id: true,
                                    name: true,
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

            this.prisma.quote.count({
                where,
            }),
        ]);

        const result = {
            message: 'Quotes fetched successfully',

            data: quotes,

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

    async getAdminJobActionLogs(query: {
        page?: number;
        limit?: number;
        jobId?: string;
        action?: string;
    }) {
        const {
            page = 1,
            limit = 10,
            jobId,
            action,
        } = query;

        const where: Prisma.AdminJobActionLogWhereInput = {
            ...(jobId && { jobId }),
            ...(action && {
                action: {
                    contains: action,
                    mode: 'insensitive',
                },
            }),
        };

        const [logs, total] = await this.prisma.$transaction([
            this.prisma.adminJobActionLog.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    admin: {
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
            }),
            this.prisma.adminJobActionLog.count({ where }),
        ]);

        return {
            success: true,
            data: logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}