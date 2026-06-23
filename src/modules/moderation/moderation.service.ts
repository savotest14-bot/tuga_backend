import { Injectable } from '@nestjs/common';

import {
    ContentType,
    ModerationStatus,
    ViolationKeyword,
} from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class ModerationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redisService: RedisService,
    ) { }

    async scanContent(
        userId: string,
        content: string,
        contentType: ContentType,
        contentId?: string,
    ) {
        const violations: any[] = [];

        const lowerContent =
            content.toLowerCase();

        const cacheKey =
            'moderation:keywords';

        let keywords: ViolationKeyword[] = [];

        const cachedKeywords =
            await this.redisService.get(cacheKey);

        if (cachedKeywords) {
            keywords =
                cachedKeywords as ViolationKeyword[];
        } else {
            keywords =
                await this.prisma.violationKeyword.findMany({
                    where: {
                        isActive: true,
                    },
                });

            await this.redisService.set(
                cacheKey,
                keywords,
                86400,
            );
        }

        // --------------------------
        // Keyword Detection
        // --------------------------

        for (const keyword of keywords) {
            if (
                lowerContent.includes(
                    keyword.keyword.toLowerCase(),
                )
            ) {
                violations.push({
                    reason: keyword.category,
                    detectedText:
                        keyword.keyword,
                    severity:
                        keyword.severity,
                });
            }
        }

        // --------------------------
        // Phone Detection
        // --------------------------

        const phoneRegex =
            /\+?\d[\d\s-]{8,15}\d/g;

        const phones =
            content.match(phoneRegex);

        if (phones?.length) {
            violations.push({
                reason:
                    'PHONE_NUMBER_DETECTED',
                detectedText: phones[0],
                severity: 2,
            });
        }

        // --------------------------
        // Email Detection
        // --------------------------

        const emailRegex =
            /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

        const emails =
            content.match(emailRegex);

        if (emails?.length) {
            violations.push({
                reason:
                    'EMAIL_DETECTED',
                detectedText: emails[0],
                severity: 2,
            });
        }

        // --------------------------
        // URL Detection
        // --------------------------

        const urlRegex =
            /(https?:\/\/|www\.)/gi;

        const urls =
            content.match(urlRegex);

        if (urls?.length) {
            violations.push({
                reason: 'URL_DETECTED',
                detectedText: urls[0],
                severity: 2,
            });
        }

        // --------------------------
        // Save Flags
        // --------------------------

        if (violations.length) {
            await this.prisma.contentFlag.createMany({
                data: violations.map(
                    (violation) => ({
                        userId,
                        contentType,
                        contentId,
                        detectedText:
                            violation.detectedText,
                        reason:
                            violation.reason,
                        severity:
                            violation.severity,
                        status:
                            ModerationStatus.PENDING,
                    }),
                ),
            });

            await this.redisService.del(
                'moderation:flags:pending',
            );
        }

        return {
            flagged:
                violations.length > 0,
            violations,
        };
    }

    async getPendingFlags() {
        const cacheKey =
            'moderation:flags:pending';

        const cached =
            await this.redisService.get(
                cacheKey,
            );

        if (cached) {
            return cached;
        }

        const flags =
            await this.prisma.contentFlag.findMany({
                where: {
                    status:
                        ModerationStatus.PENDING,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            role: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

        await this.redisService.set(
            cacheKey,
            flags,
            300, // 5 mins
        );

        return flags;
    }

    async approveFlag(id: string) {
        const flag =
            await this.prisma.contentFlag.update({
                where: { id },
                data: {
                    status:
                        ModerationStatus.APPROVED,
                    reviewedAt:
                        new Date(),
                },
            });

        await this.redisService.del(
            'moderation:flags:pending',
        );

        return flag;
    }

    async rejectFlag(id: string) {
        const flag =
            await this.prisma.contentFlag.update({
                where: { id },
                data: {
                    status:
                        ModerationStatus.REJECTED,
                    reviewedAt:
                        new Date(),
                },
            });

        await this.redisService.del(
            'moderation:flags:pending',
        );

        return flag;
    }

    async clearKeywordCache() {
        await this.redisService.del(
            'moderation:keywords',
        );
    }
}