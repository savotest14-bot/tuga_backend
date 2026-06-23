import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit
{
  constructor(private configService: ConfigService) {
    const connectionString =
      configService.get<string>('DATABASE_URL');

    const adapter = new PrismaPg({
      connectionString,
    });

    super({
      adapter,
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}