// customer.service.ts

import {
    Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
    PrismaService,
} from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { GetSavedTradersDto } from './dto/get-saved-trader.dto';

@Injectable()
export class CustomerService {

    constructor(
        private prisma: PrismaService,
        private redisService: RedisService,
    ) { }

    // =========================
    // SEARCH TRADERS
    // =========================

    async searchTraders(
        page: number,
        limit: number,
        search?: string,
        categoryId?: string,
        verified?: string,
        topRated?: string,
        latitude?: number,
        longitude?: number,
    ) {
        const skip = (page - 1) * limit;

        // =====================================
        // BASE CONDITIONS
        // =====================================

        const conditions: Prisma.Sql[] = [
            Prisma.sql`u.role = 'TRADER'`,
            Prisma.sql`u.status = 'ACTIVE'`,
            Prisma.sql`tp."isVisible" = true`,
            Prisma.sql`tp."isRegistrationCompleted" = true`,
            Prisma.sql`tp."verificationStatus" = 'APPROVED'`,
            Prisma.sql`tp."subscriptionStatus" IN ('TRIAL', 'ACTIVE')`,
        ];

        // =====================================
        // SEARCH
        // =====================================

        if (search) {
            conditions.push(
                Prisma.sql`
            (
                u."fullName" ILIKE ${`%${search}%`}
                OR tp."companyName" ILIKE ${`%${search}%`}
                OR tp."about" ILIKE ${`%${search}%`}
            )
        `,
            );
        }

        // =====================================
        // VERIFIED
        // =====================================

        if (verified === 'true') {
            conditions.push(
                Prisma.sql`
                u."isVerified" = true
            `,
            );
        }

        // =====================================
        // CATEGORY
        // =====================================

        if (categoryId) {
            conditions.push(
                Prisma.sql`
                ${categoryId} = ANY(tp."tradeCategories")
            `,
            );
        }

        // =====================================
        // DISTANCE CALCULATION
        // =====================================

        let distanceSelect = Prisma.empty;
        let orderBy = Prisma.sql`u."createdAt" DESC`;

        const hasCoordinates =
            latitude !== undefined &&
            longitude !== undefined &&
            !isNaN(latitude) &&
            !isNaN(longitude);

        if (hasCoordinates) {
            conditions.push(
                Prisma.sql`
                u.latitude IS NOT NULL
                AND u.longitude IS NOT NULL
                AND u.location IS NOT NULL
            `,
            );

            distanceSelect = Prisma.sql`
            ,
            ROUND(
                (
                    ST_Distance(
                        u.location,
                        ST_SetSRID(
                            ST_MakePoint(${longitude}, ${latitude}),
                            4326
                        )::geography
                    ) / 1000
                )::numeric,
                2
            ) AS "distanceKm"
        `;

            orderBy = Prisma.sql`"distanceKm" ASC`;
        }

        // =====================================
        // TOP RATED OVERRIDE (Bayesian Rating)
        // =====================================

        if (topRated === 'true') {
            const cacheKey = 'global:average_rating';

            let globalAverageRating =
                await this.redisService.get<number>(cacheKey);

            if (globalAverageRating === null) {
                const result =
                    await this.prisma.traderMetrics.aggregate({
                        _avg: {
                            averageRating: true,
                        },
                    });

                globalAverageRating =
                    result._avg.averageRating || 0.0;

                await this.redisService.set(
                    cacheKey,
                    globalAverageRating,
                    3600,
                );
            }

            orderBy = Prisma.sql`
            (
                (
                    COALESCE(tm."totalReviews", 0)::double precision /
                    (
                        COALESCE(tm."totalReviews", 0) + 10
                    )::double precision
                ) * COALESCE(tm."averageRating", 0)
                +
                (
                    10::double precision /
                    (
                        COALESCE(tm."totalReviews", 0) + 10
                    )::double precision
                ) * ${globalAverageRating}
            ) DESC,
            COALESCE(tm."totalReviews", 0) DESC
        `;
        }

        // =====================================
        // WHERE CLAUSE
        // =====================================

        const whereClause = Prisma.sql`
        WHERE ${Prisma.join(conditions, ' AND ')}
    `;

        // =====================================
        // GET TRADERS
        // =====================================

        const traders = await this.prisma.$queryRaw<any[]>(
            Prisma.sql`
            SELECT
                u.id,
                u."fullName",
                u."profileImage",
                u."isVerified",

                tp."companyName",
                tp."location",
                tp.logo,

                COALESCE(tm."averageRating", 0) AS "ratingAvg",
                COALESCE(tm."totalReviews", 0) AS "reviewCount",

                tp."workRadius",
                tp."subscriptionTier"

                ${distanceSelect}

            FROM "User" u

            INNER JOIN "TraderProfile" tp
                ON tp."userId" = u.id

            LEFT JOIN "TraderMetrics" tm
                ON tm."traderId" = u.id

            ${whereClause}

            ORDER BY ${orderBy}

            LIMIT ${limit}
            OFFSET ${skip}
        `,
        );

        // =====================================
        // TOTAL COUNT
        // =====================================

        const totalResult = await this.prisma.$queryRaw<
            { total: number }[]
        >(
            Prisma.sql`
            SELECT COUNT(*)::int AS total

            FROM "User" u

            INNER JOIN "TraderProfile" tp
                ON tp."userId" = u.id

            LEFT JOIN "TraderMetrics" tm
                ON tm."traderId" = u.id

            ${whereClause}
        `,
        );

        const total = totalResult?.[0]?.total || 0;

        return {
            success: true,
            data: traders,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async toggleSaveTrader(
        customerId: string,
        traderId: string,
    ) {

        const existing =
            await this.prisma.savedTrader.findUnique({
                where: {
                    customerId_traderId: {
                        customerId,
                        traderId,
                    },
                },
            });

        if (existing) {

            await this.prisma.savedTrader.delete({
                where: {
                    id: existing.id,
                },
            });

            await this.redisService.deleteByPattern(
                `saved-traders:${customerId}:*`,
            );

            return {
                message:
                    'Trader removed from saved list',
                saved: false,
            };
        }

        await this.prisma.savedTrader.create({
            data: {
                customerId,
                traderId,
            },
        });

        await this.redisService.deleteByPattern(
            `saved-traders:${customerId}:*`,
        );

        return {
            message:
                'Trader saved successfully',
            saved: true,
        };
    }

    async getSavedTraders(
        customerId: string,
        query: GetSavedTradersDto,
    ) {

        const {
            page = 1,
            limit = 10,
        } = query;

        const skip =
            (page - 1) * limit;

        const cacheKey =
            `saved-traders:${customerId}:${page}:${limit}`;

        const cached =
            await this.redisService.get(cacheKey);

        if (cached) {
            return cached;
        }

        const [savedTraders, total] =
            await Promise.all([

                this.prisma.savedTrader.findMany({
                    where: {
                        customerId,
                    },

                    include: {
                        trader: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                phone: true,
                                profileImage: true,
                                role: true,
                                traderProfile: {
                                    select: {
                                        location: true,
                                    },
                                },
                                traderMetrics: {
                                    select: {
                                        averageRating: true,
                                        bayesianRating: true,
                                        totalReviews: true,
                                        completedJobs: true,
                                        responseRate: true,
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

                this.prisma.savedTrader.count({
                    where: {
                        customerId,
                    },
                }),
            ]);

        const result = {
            message:
                'Saved traders fetched successfully',

            data: savedTraders,

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
}