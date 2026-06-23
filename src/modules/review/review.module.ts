import {
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';

import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { RedisModule } from 'src/redis/redis.module';

import { AuthMiddleware } from 'src/common/middleware/auth.middleware';
import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    NotificationModule,
    RedisModule,
    ModerationModule,
  ],

  controllers: [
    ReviewController,
  ],

  providers: [
    ReviewService,
  ],

  exports: [ReviewService],
})
export class ReviewModule implements NestModule {

  configure(
    consumer: MiddlewareConsumer,
  ) {
    consumer.apply(AuthMiddleware).forRoutes(ReviewController);
  }
}
