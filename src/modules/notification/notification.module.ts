import { forwardRef, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationService } from './notification.service';
import { NotificationProcessor } from './notification.processor';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationController } from './notification.controller';
import { RedisModule } from 'src/redis/redis.module';
import { AuthMiddleware } from 'src/common/middleware/auth.middleware';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    RedisModule,
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  controllers: [
    NotificationController,
  ],
  providers: [NotificationService, NotificationProcessor],
  exports: [NotificationService, BullModule],
})

export class NotificationModule
  implements NestModule {
  configure(
    consumer: MiddlewareConsumer,
  ) {

    consumer

      .apply(
        AuthMiddleware,
      )

      .forRoutes(
        NotificationController,
      );
  }
}
