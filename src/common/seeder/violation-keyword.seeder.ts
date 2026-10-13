import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CONTENT_MODERATION_KEYWORDS } from './data/violation-keywords.data';

@Injectable()
export class ViolationKeywordSeeder implements OnModuleInit {
  private readonly logger = new Logger(ViolationKeywordSeeder.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit() {
    await this.seedViolationKeywords();
  }

  async seedViolationKeywords(force: boolean = false) {
    try {
      const existingCount = await this.prisma.violationKeyword.count();

      // If already seeded with moderation keywords and force is false, skip
      if (existingCount >= CONTENT_MODERATION_KEYWORDS.length && !force) {
        this.logger.log(
          `Violation keywords already seeded (${existingCount} records). Skipping re-seed.`,
        );
        return;
      }

      this.logger.log(
        `Seeding ${CONTENT_MODERATION_KEYWORDS.length} violation keywords from Content Moderation Wordlist...`,
      );

      // Remove existing keywords to ensure no duplicates or obsolete dummy entries remain
      await this.prisma.violationKeyword.deleteMany({});

      // Insert in chunks of 200 for optimal database performance
      const chunkSize = 200;
      for (let i = 0; i < CONTENT_MODERATION_KEYWORDS.length; i += chunkSize) {
        const chunk = CONTENT_MODERATION_KEYWORDS.slice(i, i + chunkSize);
        await this.prisma.violationKeyword.createMany({
          data: chunk,
          skipDuplicates: true,
        });
      }

      // Invalidate Redis cache so moderation service picks up fresh list immediately
      await this.redisService.del('moderation:keywords');

      const totalCount = await this.prisma.violationKeyword.count();
      this.logger.log(
        `✅ Violation keywords seeded successfully: ${totalCount} unique keywords stored.`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to seed violation keywords: ${error?.message || error}`,
      );
    }
  }
}