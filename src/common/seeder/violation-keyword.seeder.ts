import {
  Injectable,
  OnModuleInit,
} from '@nestjs/common';

import {
  PrismaService,
} from '../../prisma/prisma.service';

import {
  ViolationCategory,
} from '@prisma/client';

@Injectable()
export class ViolationKeywordSeeder
  implements OnModuleInit
{
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.seedViolationKeywords();
  }

  async seedViolationKeywords() {
    const keywords = [
      {
        keyword: 'whatsapp',
        category:
          ViolationCategory.OFF_PLATFORM_CONTACT,
        severity: 1,
      },
      {
        keyword: 'telegram',
        category:
          ViolationCategory.OFF_PLATFORM_CONTACT,
        severity: 1,
      },
      {
        keyword: 'call me',
        category:
          ViolationCategory.OFF_PLATFORM_CONTACT,
        severity: 1,
      },
      {
        keyword: 'gmail.com',
        category:
          ViolationCategory.OFF_PLATFORM_CONTACT,
        severity: 2,
      },
      {
        keyword: 'yahoo.com',
        category:
          ViolationCategory.OFF_PLATFORM_CONTACT,
        severity: 2,
      },
    ];

    await this.prisma.violationKeyword.createMany({
      data: keywords,
      skipDuplicates: true,
    });

    console.log(
      '✅ Violation keywords seeded successfully',
    );
  }
}