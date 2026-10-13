import { Injectable, Logger } from '@nestjs/common';

import {
    ContentType,
    ModerationStatus,
    ViolationKeyword,
} from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class ModerationService {
    private readonly logger = new Logger(ModerationService.name);
    private readonly compiledRegexMap = new Map<string, RegExp>();

    constructor(
        private readonly prisma: PrismaService,
        private readonly redisService: RedisService,
    ) { }

    /**
     * Retrieves or compiles an optimized unicode word-boundary RegExp for a keyword.
     */
    private getCompiledRegex(keyword: string, global: boolean = false): RegExp {
        const lowerKey = keyword.toLowerCase().trim();
        const mapKey = global ? `${lowerKey}:g` : lowerKey;
        let regex = this.compiledRegexMap.get(mapKey);
        if (!regex) {
            const escaped = lowerKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const flags = global ? 'giu' : 'iu';
            // Unicode-aware word boundary matching: (?<=^|[^\p{L}\p{N}])keyword(?=$|[^\p{L}\p{N}])
            regex = new RegExp(
                `(?<=^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`,
                flags,
            );
            this.compiledRegexMap.set(mapKey, regex);
        }
        return regex;
    }

    /**
     * Retrieves active violation keywords from Redis cache or database.
     */
    async getActiveKeywords(): Promise<ViolationKeyword[]> {
        const cacheKey = 'moderation:keywords';
        const cachedKeywords = await this.redisService.get(cacheKey);

        if (cachedKeywords) {
            return cachedKeywords as ViolationKeyword[];
        }

        const keywords = await this.prisma.violationKeyword.findMany({
            where: {
                isActive: true,
            },
        });

        await this.redisService.set(cacheKey, keywords, 86400); // 24 hours
        return keywords;
    }

    /**
     * Scans content exclusively against configured violation keywords using
     * proper word boundary matching. Non-keyword detectors (phone, email, URL)
     * are completely removed so only verified violation keywords trigger flags.
     */
    async scanContent(
        userId: string,
        content: string,
        contentType: ContentType,
        contentId?: string,
    ) {
        if (!content || typeof content !== 'string' || !content.trim()) {
            return {
                flagged: false,
                violations: [],
                cleanContent: content || '',
            };
        }

        const keywords = await this.getActiveKeywords();
        const violations: any[] = [];
        const seenKeywords = new Set<string>();
        let cleanContent = content;

        // ----------------------------------------------------
        // Violation Keyword Detection (Word Boundary Matching)
        // ----------------------------------------------------
        for (const keyword of keywords) {
            if (!keyword.keyword) continue;
            const normKey = keyword.keyword.toLowerCase().trim();
            if (seenKeywords.has(normKey)) continue;

            const regex = this.getCompiledRegex(normKey);
            if (regex.test(content)) {
                seenKeywords.add(normKey);
                violations.push({
                    reason: keyword.category,
                    detectedText: keyword.keyword,
                    severity: keyword.severity,
                });

                // Mask all occurrences of detected violation keyword with asterisks
                const globalRegex = this.getCompiledRegex(normKey, true);
                cleanContent = cleanContent.replace(
                    globalRegex,
                    (matched) => '*'.repeat(matched.length),
                );
            }
        }

        // --------------------------
        // Save Flags for Admin Review
        // --------------------------
        if (violations.length) {
            await this.prisma.contentFlag.createMany({
                data: violations.map((violation) => ({
                    userId,
                    contentType,
                    contentId,
                    detectedText: violation.detectedText,
                    reason: violation.reason,
                    severity: violation.severity,
                    status: ModerationStatus.PENDING,
                })),
            });

            await this.redisService.del('moderation:flags:pending');
        }

        return {
            flagged: violations.length > 0,
            violations,
            cleanContent,
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
        this.compiledRegexMap.clear();
        await this.redisService.del('moderation:keywords');
    }
}