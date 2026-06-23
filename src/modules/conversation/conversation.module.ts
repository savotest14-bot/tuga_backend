import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthMiddleware } from 'src/common/middleware/auth.middleware';
import { RedisModule } from 'src/redis/redis.module';

@Module({
   imports: [
      PrismaModule,
      RedisModule,
      AuthModule,
    ],
  controllers: [ConversationController],
  providers: [ConversationService]
})

export class ConversationModule implements NestModule {

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
      .forRoutes(ConversationController);
  }
}
