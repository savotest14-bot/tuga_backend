import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';

import { JwtModule }
  from '@nestjs/jwt';

import { ChatGateway }
  from './chat.gateway';

import { ChatService }
  from './chat.service';

import { PrismaModule }
  from 'src/prisma/prisma.module';
import { ChatController } from './chat.controller';
import { AuthMiddleware } from 'src/common/middleware/auth.middleware';
import { RedisModule } from 'src/redis/redis.module';
import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    ModerationModule,
    ConfigModule,

    JwtModule.registerAsync({
      inject: [ConfigService],

      useFactory: (
        configService: ConfigService,
      ) => ({
        secret:
          configService.get<string>(
            'JWT_SECRET',
          ),

        signOptions: {
          expiresIn: '7d',
        },
      }),
    }),
  ],
  controllers: [
    ChatController,
  ],

  providers: [
    ChatGateway,
    ChatService,
  ],

  exports: [
    ChatService,
  ],
})

export class ChatModule implements NestModule {

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
      .forRoutes(ChatController);
  }
}