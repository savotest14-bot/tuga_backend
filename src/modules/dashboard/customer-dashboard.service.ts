import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SocketService } from 'src/socket/socket.service';

@Injectable()
export class CustomerDashboardService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly socketService: SocketService,
    ) {}

    async getDashboard(customerId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: customerId },
        });

        if (!user || user.role !== 'CUSTOMER') {
            throw new ForbiddenException('Only customers can access the customer dashboard');
        }

        // 1. Action Required / Counts
        // - Quotes awaiting response (PENDING quotes on customer's active jobs)
        const quotesAwaitingResponseCount = await this.prisma.quote.count({
            where: {
                status: 'PENDING',
                job: {
                    customerId,
                    status: { in: ['POSTED', 'QUOTE_RECEIVED'] },
                },
            },
        });

        // - Unreviewed completed jobs
        const completedJobs = await this.prisma.job.findMany({
            where: {
                customerId,
                status: 'COMPLETED',
            },
            include: {
                reviews: {
                    where: {
                        customerId,
                    },
                },
            },
        });
        const unreviewedJobsCount = completedJobs.filter((job) => job.reviews.length === 0).length;

        // - Active jobs (ASSIGNED or IN_PROGRESS)
        const activeJobsCount = await this.prisma.job.count({
            where: {
                customerId,
                status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
            },
        });

        const actionRequired = {
            quotesAwaitingResponseCount,
            unreviewedJobsCount,
            activeJobsCount,
        };

        // 2. Recent Jobs list (up to 3)
        const recentJobs = await this.prisma.job.findMany({
            where: { customerId },
            include: {
                _count: {
                    select: {
                        quotes: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 3,
        });

        const jobs = recentJobs.map((j) => ({
            id: j.id,
            title: j.title,
            status: j.status,
            quotesCount: j._count?.quotes || j.quotesReceived || 0,
            createdAt: j.createdAt,
        }));

        return {
            welcome: {
                fullName: user.fullName || '',
            },
            actionRequired,
            jobs,
        };
    }

    async emitDashboardUpdate(customerId: string) {
        try {
            const dashboardData = await this.getDashboard(customerId);
            this.socketService.emitToUser(customerId, 'customerDashboardUpdate', dashboardData);
        } catch (error) {
            // Silently swallow errors to prevent breaking main transaction flows
        }
    }
}
