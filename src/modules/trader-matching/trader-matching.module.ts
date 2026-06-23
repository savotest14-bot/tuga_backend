import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TraderMatchingService } from './trader-matching.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationModule } from '../notification/notification.module';
import { RedisModule } from 'src/redis/redis.module';
import { MatchingProcessor } from './matching.processor';

@Module({
  imports: [
    NotificationModule,
    RedisModule,
    BullModule.registerQueue({
      name: 'matching',
    }),
  ],
  providers: [
    TraderMatchingService,
    PrismaService,
    MatchingProcessor,
  ],
  exports: [TraderMatchingService, BullModule],
})
export class TraderMatchingModule {}