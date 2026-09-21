import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/auth/auth.service';
import { SocketService } from 'src/socket/socket.service';

@Injectable()
export class TraderDashboardService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly authService: AuthService,
        private readonly socketService: SocketService,
    ) { }


    //   async getDashboard(traderId: string) {
    //     // 1. Fetch User and Trader Profile
    //     const user = await this.prisma.user.findUnique({
    //         where: { id: traderId },
    //         include: {
    //             traderProfile: {
    //                 include: {
    //                     _count: {
    //                         select: {
    //                             portfolioItems: true,
    //                             certificates: true,
    //                             insuranceDocuments: true,
    //                         },
    //                     },
    //                 },
    //             },
    //         },
    //     });

    //     if (!user || user.role !== 'TRADER') {
    //         throw new ForbiddenException('Only traders can access the trader dashboard');
    //     }

    //     const trader = user.traderProfile;
    //     if (!trader) {
    //         throw new ForbiddenException('Trader profile not found');
    //     }

    //     // 2. Welcome Message
    //     const welcome = {
    //         fullName: user.fullName || '',
    //         companyName: trader.companyName || user.fullName || 'JS Services',
    //         displayName: trader.displayName || '',
    //     };

    //     // 3. Profile Completeness and Status (Sidebar)
    //     const regStatus: any = await this.authService.registrationStatus(traderId);
    //     const overallPercentage = regStatus.completedPercentage || 0;

    //     // Determine Next Step details
    //     let nextStep = 'Complete profile details';
    //     if (!regStatus.step1Completed) {
    //         nextStep = 'Add location and work radius';
    //     } else if (!regStatus.step2Completed) {
    //         if (regStatus.pendingStep2Fields?.includes('document') || regStatus.pendingStep2Fields?.includes('logo')) {
    //             nextStep = 'Complete profile setup (logo/documents)';
    //         } else {
    //             nextStep = 'Complete dashboard requirements';
    //         }
    //     } else if (trader.verificationStatus === 'PENDING') {
    //         nextStep = 'Awaiting Admin Approval';
    //     } else if (trader.subscriptionStatus !== 'ACTIVE' && trader.subscriptionStatus !== 'TRIAL') {
    //         nextStep = 'Activate your profile (Subscription)';
    //     } else if ((trader._count?.portfolioItems || 0) === 0) {
    //         nextStep = 'Upload job portfolio';
    //     } else if ((trader._count?.insuranceDocuments || 0) === 0) {
    //         nextStep = 'Add insurance certificate';
    //     } else if ((trader._count?.certificates || 0) === 0) {
    //         nextStep = 'Upload certificate / credentials';
    //     } else {
    //         nextStep = 'Profile fully complete!';
    //     }

    //     // Subscription details
    //     let tierName = 'Bronze Member';
    //     if (trader.subscriptionTier === 'SILVER') {
    //         tierName = 'Silver Member';
    //     } else if (trader.subscriptionTier === 'GOLD') {
    //         tierName = 'Gold Member';
    //     }

    //     const activeUntil = trader.subscriptionEndDate || trader.trialEndsAt || null;

    //     const status = {
    //         profileCompletenessPercentage: overallPercentage,
    //         profileCompletenessNextStep: nextStep,
    //         subscription: {
    //             tierName,
    //             activeUntil,
    //         },
    //     };

    //     // 4. Action Required counts
    //     // - newJobsCount: count of matches where isQuoteSubmitted = false, status is not rejected
    //     const newJobsCount = await this.prisma.jobTraderMatch.count({
    //         where: {
    //             traderId,
    //             isQuoteSubmitted: false,
    //             status: { notIn: ['REJECTED', 'ACCEPTED'] },
    //             job: {
    //                 status: { in: ['POSTED', 'QUOTE_RECEIVED'] },
    //             },
    //         },
    //     });

    //     // - quotesAwaitingResponseCount: count of quotes sent by trader that are PENDING
    //     const quotesAwaitingResponseCount = await this.prisma.quote.count({
    //         where: {
    //             traderId,
    //             status: 'PENDING',
    //             job: {
    //                 status: { in: ['POSTED', 'QUOTE_RECEIVED'] },
    //             },
    //         },
    //     });

    //     // - newReviewsCount: reviews received in the last 30 days
    //     const thirtyDaysAgo = new Date();
    //     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    //     const newReviewsCount = await this.prisma.review.count({
    //         where: {
    //             traderId,
    //             createdAt: { gte: thirtyDaysAgo },
    //         },
    //     });

    //     const actionRequired = {
    //         newJobsCount,
    //         quotesAwaitingResponseCount,
    //         newReviewsCount,
    //         profileCompleteness: {
    //             isCompleted: overallPercentage >= 100,
    //             nextStep,
    //         },
    //     };

    //     // 5. New Jobs For You (up to 3)
    //     const matchedMatches = await this.prisma.jobTraderMatch.findMany({
    //         where: {
    //             traderId,
    //             isQuoteSubmitted: false,
    //             status: { notIn: ['REJECTED', 'ACCEPTED'] },
    //             job: {
    //                 status: { in: ['POSTED', 'QUOTE_RECEIVED'] },
    //             },
    //         },
    //         include: {
    //             job: {
    //                 include: {
    //                     categories: true,
    //                     subCategories: true,
    //                     skillServices: true,
    //                     attachments: true,
    //                     _count: {
    //                         select: {
    //                             quotes: true,
    //                         },
    //                     },
    //                 },
    //             },
    //         },
    //         orderBy: {
    //             sentAt: 'desc',
    //         },
    //         take: 3,
    //     });

    //     const newJobs = matchedMatches.map((m) => {
    //         const j = m.job;
    //         return {
    //             id: j.id,
    //             title: j.title,
    //             location: j.postcode || 'Unknown Location',
    //             postedAgo: j.createdAt ? this.getRelativeTime(j.createdAt) : 'some time ago',
    //             quotesCount: j._count?.quotes || j.quotesReceived || 0,
    //             description: j.description || '',
    //         };
    //     });

    //     // 6. Open Jobs (up to 3) - Jobs where this trader submitted a quote and the job is active
    //     const activeQuotes = await this.prisma.quote.findMany({
    //         where: {
    //             traderId,
    //             status: 'PENDING',
    //             job: {
    //                 status: { in: ['POSTED', 'QUOTE_RECEIVED'] },
    //             },
    //         },
    //         include: {
    //             job: {
    //                 include: {
    //                     _count: {
    //                         select: {
    //                             quotes: true,
    //                         },
    //                     },
    //                 },
    //             },
    //         },
    //         orderBy: {
    //             createdAt: 'desc',
    //         },
    //         take: 3,
    //     });

    //     const openJobs = activeQuotes.map((q) => {
    //         const j = q.job;
    //         return {
    //             jobId: j.id,
    //             quoteId: q.id,
    //             title: j.title,
    //             location: j.postcode || 'Unknown Location',
    //             quotesCount: j._count?.quotes || j.quotesReceived || 0,
    //             status: j.status,
    //             price: q.price ? parseFloat(q.price.toString()) : null,
    //             createdAt: j.createdAt,
    //         };
    //     });

    //     // 7. Performance metrics (Calculations with trends)
    //     const sixtyDaysAgo = new Date();
    //     sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    //     // a. Jobs Viewed
    //     const currentJobsViewed = await this.prisma.jobTraderMatch.count({
    //         where: {
    //             traderId,
    //             viewedAt: { gte: thirtyDaysAgo },
    //         },
    //     });
    //     const prevJobsViewed = await this.prisma.jobTraderMatch.count({
    //         where: {
    //             traderId,
    //             viewedAt: {
    //                 gte: sixtyDaysAgo,
    //                 lt: thirtyDaysAgo,
    //             },
    //         },
    //     });
    //     const totalJobsViewed = await this.prisma.jobTraderMatch.count({
    //         where: {
    //             traderId,
    //             viewedAt: { not: null },
    //         },
    //     });
    //     const jobsViewedTrend = this.calculateTrend(currentJobsViewed, prevJobsViewed);

    //     // b. Quotes Sent
    //     const currentQuotesSent = await this.prisma.quote.count({
    //         where: {
    //             traderId,
    //             createdAt: { gte: thirtyDaysAgo },
    //         },
    //     });
    //     const prevQuotesSent = await this.prisma.quote.count({
    //         where: {
    //             traderId,
    //             createdAt: {
    //                 gte: sixtyDaysAgo,
    //                 lt: thirtyDaysAgo,
    //             },
    //         },
    //     });
    //     const totalQuotesSent = await this.prisma.quote.count({
    //         where: {
    //             traderId,
    //         },
    //     });
    //     const quotesSentTrend = this.calculateTrend(currentQuotesSent, prevQuotesSent);

    //     // c. Quote Acceptance Rate
    //     const currentAccepted = await this.prisma.quote.count({
    //         where: {
    //             traderId,
    //             status: 'ACCEPTED',
    //             createdAt: { gte: thirtyDaysAgo },
    //         },
    //     });
    //     const currentAcceptanceRate = currentQuotesSent > 0 ? Math.round((currentAccepted / currentQuotesSent) * 100) : 0;

    //     const prevAccepted = await this.prisma.quote.count({
    //         where: {
    //             traderId,
    //             status: 'ACCEPTED',
    //             createdAt: {
    //                 gte: sixtyDaysAgo,
    //                 lt: thirtyDaysAgo,
    //             },
    //         },
    //     });
    //     const prevAcceptanceRate = prevQuotesSent > 0 ? Math.round((prevAccepted / prevQuotesSent) * 100) : 0;

    //     const totalAccepted = await this.prisma.quote.count({
    //         where: {
    //             traderId,
    //             status: 'ACCEPTED',
    //         },
    //     });
    //     const totalAcceptanceRate = totalQuotesSent > 0 ? Math.round((totalAccepted / totalQuotesSent) * 100) : 0;
    //     const acceptanceRateTrend = currentAcceptanceRate - prevAcceptanceRate; // Percentage point change

    //     // d. Profile Views (Mocked realistically using job matches and viewed count)
    //     const mockProfileViews = totalJobsViewed * 2 + 12;
    //     const mockProfileViewsTrend = 15; // default 15%

    //     // e. Average Rating & Response Rate from TraderMetrics
    //     const metrics = await this.prisma.traderMetrics.findUnique({
    //         where: { traderId },
    //     });

    //     const averageRating = metrics?.averageRating || 0;
    //     const ratingTrend = 0.2;

    //     const responseRate = metrics?.responseRate || 0;
    //     const responseRateTrend = 7; // default 7%

    //     const performance = {
    //         jobsViewed: {
    //             value: totalJobsViewed,
    //             trendPercentage: jobsViewedTrend,
    //         },
    //         quotesSent: {
    //             value: totalQuotesSent,
    //             trendPercentage: quotesSentTrend,
    //         },
    //         quoteAcceptanceRate: {
    //             value: totalAcceptanceRate,
    //             trendPercentage: acceptanceRateTrend,
    //         },
    //         profileViews: {
    //             value: mockProfileViews,
    //             trendPercentage: mockProfileViewsTrend,
    //         },
    //         averageRating: {
    //             value: parseFloat(averageRating.toFixed(1)),
    //             trendChange: ratingTrend,
    //         },
    //         responseRate: {
    //             value: Math.round(responseRate * 100),
    //             trendPercentage: responseRateTrend,
    //         },
    //     };

    //     return {
    //         welcome,
    //         actionRequired,
    //         status,
    //         newJobs,
    //         openJobs,
    //         performance,
    //     };
    // }

    
    async getDashboard(traderId: string) {
        // 1. Fetch User and Trader Profile
        const user = await this.prisma.user.findUnique({
            where: { id: traderId },
            include: {
                traderProfile: {
                    include: {
                        _count: {
                            select: {
                                portfolioItems: true,
                                certificates: true,
                                insuranceDocuments: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user || user.role !== 'TRADER') {
            throw new ForbiddenException('Only traders can access the trader dashboard');
        }

        const trader = user.traderProfile;
        if (!trader) {
            throw new ForbiddenException('Trader profile not found');
        }

        // 2. Welcome Message
        const welcome = {
            fullName: user.fullName || '',
            companyName: trader.companyName || user.fullName || 'JS Services',
            displayName: trader.displayName || '',
        };

        // 3. Profile Completeness and Status (Sidebar)
        const regStatus: any = await this.authService.registrationStatus(traderId);
        const overallPercentage = regStatus.completedPercentage || 0;

        // Determine Next Step details
        let nextStep = 'Complete profile details';
        if (!regStatus.step1Completed) {
            nextStep = 'Add location and work radius';
        } else if (!regStatus.step2Completed) {
            if (regStatus.pendingStep2Fields?.includes('document') || regStatus.pendingStep2Fields?.includes('logo')) {
                nextStep = 'Complete profile setup (logo/documents)';
            } else {
                nextStep = 'Complete dashboard requirements';
            }
        } else if (trader.verificationStatus === 'PENDING') {
            nextStep = 'Awaiting Admin Approval';
        } else if (trader.subscriptionStatus !== 'ACTIVE' && trader.subscriptionStatus !== 'TRIAL') {
            nextStep = 'Activate your profile (Subscription)';
        } else if ((trader._count?.portfolioItems || 0) === 0) {
            nextStep = 'Upload job portfolio';
        } else if ((trader._count?.insuranceDocuments || 0) === 0) {
            nextStep = 'Add insurance certificate';
        } else if ((trader._count?.certificates || 0) === 0) {
            nextStep = 'Upload certificate / credentials';
        } else {
            nextStep = 'Profile fully complete!';
        }

        // Subscription details
        let tierName = 'Bronze Member';
        if (trader.subscriptionTier === 'SILVER') {
            tierName = 'Silver Member';
        } else if (trader.subscriptionTier === 'GOLD') {
            tierName = 'Gold Member';
        }

        const activeUntil = trader.subscriptionEndDate || trader.trialEndsAt || null;

        const status = {
            profileCompletenessPercentage: overallPercentage,
            profileCompletenessNextStep: nextStep,
            subscription: {
                tierName,
                activeUntil,
            },
        };

        // 4. Action Required counts
        // - newJobsCount: count of matches where isQuoteSubmitted = false, status is not rejected
        const newJobsCount = await this.prisma.jobTraderMatch.count({
            where: {
                traderId,
                isQuoteSubmitted: false,
                status: { notIn: ['REJECTED', 'ACCEPTED'] },
                job: {
                    status: { in: ['POSTED', 'QUOTE_RECEIVED'] },
                },
            },
        });

        // - quotesAwaitingResponseCount: count of quotes sent by trader that are PENDING
        const quotesAwaitingResponseCount = await this.prisma.quote.count({
            where: {
                traderId,
                status: 'PENDING',
                job: {
                    status: { in: ['POSTED', 'QUOTE_RECEIVED'] },
                },
            },
        });

        // - newReviewsCount: reviews received in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newReviewsCount = await this.prisma.review.count({
            where: {
                traderId,
                createdAt: { gte: thirtyDaysAgo },
            },
        });

        // - inProgressJobsCount: count of jobs assigned to / in progress with this trader
        const inProgressJobsCount = await this.prisma.job.count({
            where: {
                selectedTraderId: traderId,
                status: { in: ['IN_PROGRESS', 'ASSIGNED'] },
            },
        });

        const actionRequired = {
            newJobsCount,
            quotesAwaitingResponseCount,
            inProgressJobsCount,
            newReviewsCount,
            profileCompleteness: {
                isCompleted: overallPercentage >= 100,
                nextStep,
            },
        };

        // 5. New Jobs For You (up to 3)
        const matchedMatches = await this.prisma.jobTraderMatch.findMany({
            where: {
                traderId,
                isQuoteSubmitted: false,
                status: { notIn: ['REJECTED', 'ACCEPTED'] },
                job: {
                    status: { in: ['POSTED', 'QUOTE_RECEIVED'] },
                },
            },
            include: {
                job: {
                    include: {
                        categories: true,
                        subCategories: true,
                        skillServices: true,
                        attachments: true,
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
            take: 3,
        });

        const newJobs = matchedMatches.map((m) => {
            const j = m.job;
            const firstAttachment = j.attachments?.[0];
            const tags = Array.from(
                new Set([
                    ...j.categories.map((c) => c.name),
                    ...j.skillServices.map((s) => s.name),
                    ...j.subCategories.map((sc) => sc.name),
                ]),
            ).filter(Boolean);

            let distanceKm: number | null = null;
            if (m.distanceKm != null) {
                distanceKm = Number(Number(m.distanceKm).toFixed(1));
            } else if (
                user.latitude != null &&
                user.longitude != null &&
                j.latitude != null &&
                j.longitude != null
            ) {
                distanceKm = this.calculateDistance(
                    Number(user.latitude),
                    Number(user.longitude),
                    Number(j.latitude),
                    Number(j.longitude),
                );
            }

            return {
                id: j.id,
                matchId: m.id,
                title: j.title,
                description: j.description || '',
                location: j.postcode || 'Unknown Location',
                postcode: j.postcode || '',
                distanceKm,
                distance: distanceKm !== null ? `${distanceKm} km` : null,
                distanceText: distanceKm !== null ? `${distanceKm} km` : null,
                postedAgo: j.createdAt ? this.getRelativeTime(j.createdAt) : 'some time ago',
                badge: 'NEW',
                isNew: true,
                quotesCount: j._count?.quotes || j.quotesReceived || 0,
                imageUrl: firstAttachment ? this.formatAttachmentUrl(firstAttachment.file) : null,
                attachments: (j.attachments || []).map((a) => ({
                    id: a.id,
                    file: a.file,
                    url: this.formatAttachmentUrl(a.file),
                })),
                tags,
                category: j.categories[0] || null,
                skillService: j.skillServices[0] || null,
                subCategory: j.subCategories[0] || null,
                categories: j.categories,
                skillServices: j.skillServices,
                subCategories: j.subCategories,
                emergency: j.emergency,
                timescale: j.timescale,
                budgetRange: j.budgetRange,
                createdAt: j.createdAt,
            };
        });

        // 6. Open Jobs (up to 3) - Jobs where this trader submitted a quote and the job is active
        const activeQuotes = await this.prisma.quote.findMany({
            where: {
                traderId,
                status: 'PENDING',
                job: {
                    status: { in: ['POSTED', 'QUOTE_RECEIVED'] },
                },
            },
            include: {
                job: {
                    include: {
                        categories: true,
                        subCategories: true,
                        skillServices: true,
                        attachments: true,
                        _count: {
                            select: {
                                quotes: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 3,
        });

        const openJobs = activeQuotes.map((q) => {
            const j = q.job;
            const firstAttachment = j.attachments?.[0];
            const tags = Array.from(
                new Set([
                    ...j.categories.map((c) => c.name),
                    ...j.skillServices.map((s) => s.name),
                    ...j.subCategories.map((sc) => sc.name),
                ]),
            ).filter(Boolean);

            return {
                jobId: j.id,
                quoteId: q.id,
                title: j.title,
                location: j.postcode || 'Unknown Location',
                postcode: j.postcode || '',
                quotesCount: j._count?.quotes || j.quotesReceived || 0,
                status: j.status,
                price: q.price ? parseFloat(q.price.toString()) : null,
                postedAgo: j.createdAt ? this.getRelativeTime(j.createdAt) : 'some time ago',
                imageUrl: firstAttachment ? this.formatAttachmentUrl(firstAttachment.file) : null,
                attachments: (j.attachments || []).map((a) => ({
                    id: a.id,
                    file: a.file,
                    url: this.formatAttachmentUrl(a.file),
                })),
                tags,
                createdAt: j.createdAt,
            };
        });

        // 6.5. Jobs You're Working On (In-Progress / Assigned jobs)
        const workingJobsList = await this.prisma.job.findMany({
            where: {
                selectedTraderId: traderId,
                status: { in: ['IN_PROGRESS', 'ASSIGNED'] },
            },
            include: {
                categories: true,
                subCategories: true,
                skillServices: true,
                attachments: true,
                customer: {
                    select: {
                        id: true,
                        fullName: true,
                        profileImage: true,
                        phone: true,
                        email: true,
                    },
                },
                quotes: {
                    where: {
                        traderId,
                        status: 'ACCEPTED',
                    },
                    select: {
                        id: true,
                        price: true,
                    },
                    take: 1,
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
            take: 5,
        });

        const inProgressJobs = workingJobsList.map((j) => {
            const firstAttachment = j.attachments?.[0];
            const acceptedQuote = j.quotes?.[0];
            const tags = Array.from(
                new Set([
                    ...j.categories.map((c) => c.name),
                    ...j.skillServices.map((s) => s.name),
                    ...j.subCategories.map((sc) => sc.name),
                ]),
            ).filter(Boolean);

            return {
                id: j.id,
                jobId: j.id,
                title: j.title,
                description: j.description || '',
                location: j.postcode || 'Unknown Location',
                postcode: j.postcode || '',
                status: j.status,
                imageUrl: firstAttachment ? this.formatAttachmentUrl(firstAttachment.file) : null,
                attachments: (j.attachments || []).map((a) => ({
                    id: a.id,
                    file: a.file,
                    url: this.formatAttachmentUrl(a.file),
                })),
                tags,
                price: acceptedQuote?.price ? parseFloat(acceptedQuote.price.toString()) : null,
                customer: j.customer ? {
                    id: j.customer.id,
                    fullName: j.customer.fullName || '',
                    profileImage: j.customer.profileImage ? this.formatAttachmentUrl(j.customer.profileImage) : null,
                    phone: j.customer.phone || null,
                    email: j.customer.email || null,
                } : null,
                postedAgo: j.createdAt ? this.getRelativeTime(j.createdAt) : 'some time ago',
                updatedAt: j.updatedAt,
                createdAt: j.createdAt,
            };
        });

        // 7. Performance metrics (Calculations with trends)
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // a. Jobs Viewed
        const currentJobsViewed = await this.prisma.jobTraderMatch.count({
            where: {
                traderId,
                viewedAt: { gte: thirtyDaysAgo },
            },
        });
        const prevJobsViewed = await this.prisma.jobTraderMatch.count({
            where: {
                traderId,
                viewedAt: {
                    gte: sixtyDaysAgo,
                    lt: thirtyDaysAgo,
                },
            },
        });
        const totalJobsViewed = await this.prisma.jobTraderMatch.count({
            where: {
                traderId,
                viewedAt: { not: null },
            },
        });
        const jobsViewedTrend = this.calculateTrend(currentJobsViewed, prevJobsViewed);

        // b. Quotes Sent
        const currentQuotesSent = await this.prisma.quote.count({
            where: {
                traderId,
                createdAt: { gte: thirtyDaysAgo },
            },
        });
        const prevQuotesSent = await this.prisma.quote.count({
            where: {
                traderId,
                createdAt: {
                    gte: sixtyDaysAgo,
                    lt: thirtyDaysAgo,
                },
            },
        });
        const totalQuotesSent = await this.prisma.quote.count({
            where: {
                traderId,
            },
        });
        const quotesSentTrend = this.calculateTrend(currentQuotesSent, prevQuotesSent);

        // c. Quote Acceptance Rate
        const currentAccepted = await this.prisma.quote.count({
            where: {
                traderId,
                status: 'ACCEPTED',
                createdAt: { gte: thirtyDaysAgo },
            },
        });
        const currentAcceptanceRate = currentQuotesSent > 0 ? Math.round((currentAccepted / currentQuotesSent) * 100) : 0;

        const prevAccepted = await this.prisma.quote.count({
            where: {
                traderId,
                status: 'ACCEPTED',
                createdAt: {
                    gte: sixtyDaysAgo,
                    lt: thirtyDaysAgo,
                },
            },
        });
        const prevAcceptanceRate = prevQuotesSent > 0 ? Math.round((prevAccepted / prevQuotesSent) * 100) : 0;

        const totalAccepted = await this.prisma.quote.count({
            where: {
                traderId,
                status: 'ACCEPTED',
            },
        });
        const totalAcceptanceRate = totalQuotesSent > 0 ? Math.round((totalAccepted / totalQuotesSent) * 100) : 0;
        const acceptanceRateTrend = currentAcceptanceRate - prevAcceptanceRate; // Percentage point change

        // d. Profile Views (Mocked realistically using job matches and viewed count)
        const mockProfileViews = totalJobsViewed * 2 + 12;
        const mockProfileViewsTrend = 15; // default 15%

        // e. Average Rating & Response Rate from TraderMetrics
        const metrics = await this.prisma.traderMetrics.findUnique({
            where: { traderId },
        });

        const averageRating = metrics?.averageRating || 0;
        const ratingTrend = 0.2;

        const responseRate = metrics?.responseRate || 0;
        const responseRateTrend = 7; // default 7%

        const performance = {
            jobsViewed: {
                value: totalJobsViewed,
                trendPercentage: jobsViewedTrend,
            },
            quotesSent: {
                value: totalQuotesSent,
                trendPercentage: quotesSentTrend,
            },
            quoteAcceptanceRate: {
                value: totalAcceptanceRate,
                trendPercentage: acceptanceRateTrend,
            },
            profileViews: {
                value: mockProfileViews,
                trendPercentage: mockProfileViewsTrend,
            },
            averageRating: {
                value: parseFloat(averageRating.toFixed(1)),
                trendChange: ratingTrend,
            },
            responseRate: {
                value: Math.round(responseRate * 100),
                trendPercentage: responseRateTrend,
            },
        };

        return {
            welcome,
            actionRequired,
            status,
            newJobs,
            openJobs,
            inProgressJobs,
            jobsWorkingOn: inProgressJobs,
            performance,
        };
    }

    private formatAttachmentUrl(file: string | null | undefined): string | null {
        if (!file) return null;
        if (file.startsWith('http://') || file.startsWith('https://')) return file;
        const baseUrl = process.env.APP_URL || '';
        const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        const cleanPath = file.startsWith('/') ? file.slice(1) : file;
        return `${cleanBase}/${cleanPath}`;
    }

    private calculateDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number,
    ): number {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) *
            Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Number((R * c).toFixed(1));
    }

    private toRad(value: number): number {
        return (value * Math.PI) / 180;
    }

    private getRelativeTime(date: Date): string {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return 'just now';

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
            return `${minutes} min ago`;
        }

        const hours = Math.floor(seconds / 3600);
        if (hours < 24) {
            return hours === 1 ? '1 hr ago' : `${hours} hrs ago`;
        }

        const days = Math.floor(seconds / 86400);
        if (days < 30) {
            return days === 1 ? '1 day ago' : `${days} days ago`;
        }

        const months = Math.floor(seconds / 2592000);
        if (months < 12) {
            return months === 1 ? '1 month ago' : `${months} months ago`;
        }

        const years = Math.floor(seconds / 31536000);
        return years === 1 ? '1 year ago' : `${years} years ago`;
    }

    private calculateTrend(current: number, previous: number): number {
        if (previous === 0) {
            return current > 0 ? 100 : 0;
        }
        return Math.round(((current - previous) / previous) * 100);
    }

    async emitDashboardUpdate(traderId: string) {
        try {
            const dashboardData = await this.getDashboard(traderId);
            this.socketService.emitToUser(traderId, 'traderDashboardUpdate', dashboardData);
        } catch (error) {
            // Silently swallow errors to prevent breaking main transaction flows
        }
    }

    async getCustomerDetails(traderId: string, customerId: string) {
        // 1. Verify caller is a trader
        const caller = await this.prisma.user.findUnique({
            where: { id: traderId },
        });

        if (!caller || caller.role !== 'TRADER') {
            throw new ForbiddenException('Only traders can view customer details');
        }

        // 2. Fetch Customer details
        const customer = await this.prisma.user.findUnique({
            where: { id: customerId },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                profileImage: true,
                createdAt: true,
                role: true,
                _count: {
                    select: {
                        jobs: true,
                    },
                },
            },
        });

        if (!customer || customer.role !== 'CUSTOMER') {
            throw new NotFoundException('Customer not found');
        }

        // Return formatted details
        return {
            id: customer.id,
            fullName: customer.fullName,
            email: customer.email,
            phone: customer.phone,
            profileImage: customer.profileImage ? `${process.env.APP_URL}/${customer.profileImage}` : null,
            createdAt: customer.createdAt,
            totalJobsPosted: customer._count.jobs,
        };
    }
}
