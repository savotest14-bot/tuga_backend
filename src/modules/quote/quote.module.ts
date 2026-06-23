import {
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';

import { QuoteController } from './quote.controller';
import { QuoteService } from './quote.service';

import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationModule } from '../notification/notification.module';

import { AuthMiddleware } from 'src/common/middleware/auth.middleware';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RedisModule,
    NotificationModule,
  ],

  controllers: [
    QuoteController,
  ],

  providers: [
    QuoteService,
  ],
})
export class QuoteModule
  implements NestModule {

  configure(
    consumer: MiddlewareConsumer,
  ) {

    consumer
      .apply(AuthMiddleware)
      .forRoutes(QuoteController);
  }
}