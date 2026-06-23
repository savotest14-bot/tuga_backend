import {
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { TraderMatchingModule } from '../trader-matching/trader-matching.module';
import { AuthMiddleware } from 'src/common/middleware/auth.middleware';
import { JobEscalationService } from './job-escalation.service';
import { EscalationProcessor } from './escalation.processor';
import { NotificationModule } from '../notification/notification.module';
import { RedisModule } from 'src/redis/redis.module';
import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    NotificationModule,
    RedisModule,
    TraderMatchingModule,
    ModerationModule,
    BullModule.registerQueue({
      name: 'escalation',
    }),
  ],
  controllers: [JobController],
  providers: [JobService, JobEscalationService, EscalationProcessor],
})
export class JobModule implements NestModule {

  configure(
    consumer: MiddlewareConsumer,
  ) {

    /*
    |--------------------------------------------------------------------------
    | AUTH MIDDLEWARE
    |--------------------------------------------------------------------------
    */

    consumer
      .apply(AuthMiddleware)
      .forRoutes(JobController);
  }
}