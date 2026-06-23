import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateReportDto } from './dto/create-report.dto';
import { GetReportsDto } from './dto/get-reports.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { RedisService } from 'src/redis/redis.service';
import { GetMyReportsDto } from './dto/get-my-reports.dto';

@Injectable()
export class ReportService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redisService: RedisService,
    ) { }

    async createReport(
        userId: string,
        dto: CreateReportDto,
    ) {
        const existingReport =
            await this.prisma.report.findFirst({
                where: {
                    reporterId: userId,
                    reportType: dto.reportType,
                    targetId: dto.targetId,
                },
            });

        if (existingReport) {
            throw new BadRequestException(
                'You already reported this item',
            );
        }

        const report =
            await this.prisma.report.create({
                data: {
                    reporterId: userId,
                    reportType: dto.reportType,
                    targetId: dto.targetId,
                    reason: dto.reason,
                    customReason: dto.customReason,
                },
            });

        await this.redisService.deleteByPattern(
            `reports:user:${userId}:*`,
        );

        await this.redisService.deleteByPattern(
            'reports:admin:*',
        );

        return report;
    }

    async getMyReports(
        userId: string,
        query: GetMyReportsDto,
    ) {

        const page =
            Number(query.page) || 1;

        const limit =
            Number(query.limit) || 10;

        const skip =
            (page - 1) * limit;

        const cacheKey =
            `reports:user:${userId}:${page}:${limit}:${query.search || 'all'}:${query.status || 'all'}:${query.reason || 'all'}:${query.reportType || 'all'}`;

        const cached =
            await this.redisService.get(
                cacheKey,
            );

        if (cached) {
            return cached;
        }

        const where: any = {
            reporterId: userId,
        };

        if (query.status) {
            where.status =
                query.status;
        }

        if (query.reason) {
            where.reason =
                query.reason;
        }

        if (query.reportType) {
            where.reportType =
                query.reportType;
        }

        if (query.search) {
            where.OR = [
                {
                    targetId: {
                        contains:
                            query.search,
                        mode: 'insensitive',
                    },
                },
                {
                    customReason: {
                        contains:
                            query.search,
                        mode: 'insensitive',
                    },
                },
            ];
        }

        const [data, total] =
            await Promise.all([
                this.prisma.report.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: {
                        createdAt: 'desc',
                    },
                }),

                this.prisma.report.count({
                    where,
                }),
            ]);

        const result = {
            total,
            page,
            limit,
            data,
        };

        await this.redisService.set(
            cacheKey,
            result,
            120,
        );

        return result;
    }

    async getMyReportDetails(
        userId: string,
        reportId: string,
    ) {

        const cacheKey =
            `report:user:${userId}:${reportId}`;

        const cached =
            await this.redisService.get(
                cacheKey,
            );

        if (cached) {
            return cached;
        }

        const report =
            await this.prisma.report.findFirst({
                where: {
                    id: reportId,
                    reporterId: userId,
                },
            });

        if (!report) {
            throw new NotFoundException(
                'Report not found',
            );
        }

        let targetData:
            | Record<string, any>
            | null = null;

        const userSelect = {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profileImage: true,
            role: true,
            status: true,
            isVerified: true,
            createdAt: true,
        };
        switch (report.reportType) {

            case 'USER':
                targetData =
                    await this.prisma.user.findUnique({
                        where: {
                            id: report.targetId,
                        },
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    });
                break;

            case 'REVIEW':
                targetData =
                    await this.prisma.review.findUnique({
                        where: {
                            id: report.targetId,
                        },

                        include: {
                            customer: {
                                select: userSelect,
                            },

                            trader: {
                                select: userSelect,
                            },
                        },
                    });
                break;

            case 'JOB':
                targetData =
                    await this.prisma.job.findUnique({
                        where: {
                            id: report.targetId,
                        },
                    });
                break;

            case 'MESSAGE':
                targetData =
                    await this.prisma.message.findUnique({
                        where: {
                            id: report.targetId,
                        },
                    });
                break;

            case 'TRADER_PROFILE':
                targetData =
                    await this.prisma.traderProfile.findUnique({
                        where: {
                            id: report.targetId,
                        },

                        include: {
                            user: {
                                select: userSelect,
                            },
                        },
                    });
                break;
        }

        const result = {
            ...report,
            targetData,
        };

        await this.redisService.set(
            cacheKey,
            result,
            120,
        );

        return result;
    }

    async getReports(
        query: GetReportsDto,
    ) {

        const page =
            Number(query.page) || 1;

        const limit =
            Number(query.limit) || 10;

        const cacheKey =
            `reports:admin:${page}:${limit}:${query.status || 'all'}:${query.reportType || 'all'}:${query.reason || 'all'}`;

        const cached =
            await this.redisService.get(
                cacheKey,
            );

        if (cached) {
            return cached;
        }

        const skip =
            (page - 1) * limit;

        const where: any = {};

        if (query.status) {
            where.status =
                query.status;
        }

        if (query.reason) {
            where.reason =
                query.reason;
        }

        if (query.reportType) {
            where.reportType =
                query.reportType;
        }

        const [data, total] =
            await Promise.all([
                this.prisma.report.findMany({
                    where,
                    skip,
                    take: limit,

                    include: {
                        reporter: {
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
                }),

                this.prisma.report.count({
                    where,
                }),
            ]);

        const result = {
            total,
            page,
            limit,
            data,
        };

        await this.redisService.set(
            cacheKey,
            result,
            120,
        );

        return result;
    }

    async getReportById(
        reportId: string,
        adminId: string,
    ) {

        const cacheKey =
            `report:${reportId}`;

        const cached =
            await this.redisService.get(
                cacheKey,
            );

        if (cached) {
            return cached;
        }

        const userSelect = {
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
            isOnline: true,
            lastSeen: true,
        };

        let report =
            await this.prisma.report.findUnique({
                where: {
                    id: reportId,
                },

                include: {
                    reporter: {
                        select: userSelect,
                    },

                    reviewedBy: {
                        select: userSelect,
                    },
                },
            });

        if (!report) {
            throw new NotFoundException(
                'Report not found',
            );
        }

        // Auto mark as reviewed when admin opens report

        if (
            report.status === 'PENDING'
        ) {

            report =
                await this.prisma.report.update({
                    where: {
                        id: reportId,
                    },

                    data: {
                        status: 'REVIEWED',
                        reviewedById: adminId,
                        reviewedAt: new Date(),
                    },

                    include: {
                        reporter: {
                            select: userSelect,
                        },

                        reviewedBy: {
                            select: userSelect,
                        },
                    },
                });

            // Clear caches

            await this.redisService.del(
                `report:${reportId}`,
            );

            await this.redisService.del(
                `report:user:${report.reporterId}:${reportId}`,
            );

            await this.redisService.del(
                `reports:user:${report.reporterId}`,
            );
        }

        let targetData: any = null;

        switch (report.reportType) {

            case 'USER':

                targetData =
                    await this.prisma.user.findUnique({
                        where: {
                            id: report.targetId,
                        },

                        select: userSelect,
                    });

                break;

            case 'REVIEW':

                targetData =
                    await this.prisma.review.findUnique({
                        where: {
                            id: report.targetId,
                        },

                        include: {
                            customer: {
                                select: userSelect,
                            },

                            trader: {
                                select: userSelect,
                            },

                            job: true,
                        },
                    });

                break;

            case 'JOB':

                targetData =
                    await this.prisma.job.findUnique({
                        where: {
                            id: report.targetId,
                        },

                        include: {
                            customer: {
                                select: userSelect,
                            },

                            selectedTrader: {
                                select: userSelect,
                            },
                        },
                    });

                break;

            case 'MESSAGE':

                targetData =
                    await this.prisma.message.findUnique({
                        where: {
                            id: report.targetId,
                        },
                    });

                break;

            case 'TRADER_PROFILE':

                targetData =
                    await this.prisma.traderProfile.findUnique({
                        where: {
                            id: report.targetId,
                        },

                        include: {
                            user: {
                                select: userSelect,
                            },
                        },
                    });

                break;
        }

        const result = {
            ...report,
            targetData,
        };

        await this.redisService.set(
            cacheKey,
            result,
            120,
        );

        return result;
    }

    async updateStatus(
        adminId: string,
        reportId: string,
        dto: UpdateReportStatusDto,
    ) {
        const report =
            await this.prisma.report.findUnique({
                where: {
                    id: reportId,
                },
            });

        if (!report) {
            throw new NotFoundException(
                'Report not found',
            );
        }

        const updatedReport =
            await this.prisma.report.update({
                where: {
                    id: reportId,
                },
                data: {
                    status: dto.status,
                    reviewedById: adminId,
                    reviewedAt: new Date(),
                },
            });

        await this.redisService.del(
            `report:${reportId}`,
        );

        await this.redisService.del(
            `report:user:${updatedReport.reporterId}:${reportId}`,
        );

        await this.redisService.del(
            `reports:user:${updatedReport.reporterId}`,
        );
        await this.redisService.deleteByPattern(
            'reports:admin:*',
        );

        return updatedReport;
    }
}