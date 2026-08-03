import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionRenewalProcessor } from './subscription-renewal.processor';
import { SubscriptionGuardService } from './subscription-guard.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { AuthModule } from '../../auth/auth.module';
import { AuthMiddleware } from '../../common/middleware/auth.middleware';

@Module({
  imports: [PrismaModule, RedisModule, AuthModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionRenewalProcessor, SubscriptionGuardService],
  exports: [SubscriptionsService, SubscriptionGuardService],
})
export class SubscriptionsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(SubscriptionsController);
  }
}
