import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';

import { AuthService } from './auth.service';

import { AuthController } from './auth.controller';

import { PrismaService } from '../prisma/prisma.service';

import { MailModule } from 'src/common/mail/mail.module';

import { AuthMiddleware } from 'src/common/middleware/auth.middleware';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RedisModule } from 'src/redis/redis.module';
import { ModerationModule } from 'src/modules/moderation/moderation.module';

@Module({
  imports: [
    ConfigModule,
    NotificationModule,
    MailModule,
    PassportModule,
    ModerationModule,
    RedisModule,

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
          expiresIn: '30d',
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    PrismaService,
    JwtStrategy,
  ],

  exports: [
    AuthService,
    JwtModule,
  ],
})
export class AuthModule
  implements NestModule {
  configure(
    consumer: MiddlewareConsumer,
  ) {
    consumer
      .apply(AuthMiddleware)

      .forRoutes(

        // Change Password
        {
          path: 'auth/change-password',
          method: RequestMethod.POST,
        },

        // Trader Step 2
        {
          path:
            'auth/trader/register-step-2',
          method: RequestMethod.PUT,
        },

        // Trader Step 3
        {
          path:
            'auth/trader/register-step-3',
          method: RequestMethod.PUT,
        },

        // Registration Status
        {
          path:
            'auth/trader/registration-status',
          method: RequestMethod.GET,
        },
        {
          path: 'auth/logout',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/getMyProfile',
          method: RequestMethod.GET,
        },
        {
          path: 'auth/updateProfile',
          method: RequestMethod.PUT,
        },
        {
          path: 'auth/update-trader-assets',
          method: RequestMethod.PUT,
        }
      );
  }
}