import { forwardRef, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { ModerationService } from './moderation.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { RedisModule } from 'src/redis/redis.module';
import { AuthMiddleware } from 'src/common/middleware/auth.middleware';
import { AuthorizeMiddleware } from 'src/common/middleware/authorize.middleware';
import { ModerationController } from './moderation.controller';


@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    RedisModule,
  ],
  controllers: [ModerationController],
  providers: [
    ModerationService,
  ],
  exports: [ModerationService],
})
export class ModerationModule
  implements NestModule {
  configure(
    consumer: MiddlewareConsumer,
  ) {

    consumer

      .apply(

        AuthMiddleware,

        AuthorizeMiddleware(
          'ADMIN',
        ),
      )

      .forRoutes(
        ModerationController,
      );
  }
}