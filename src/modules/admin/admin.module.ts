// admin.module.ts

import {
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';

import {
  AdminController,
} from './admin.controller';

import {
  AdminService,
} from './admin.service';

import {
  PrismaService,
} from 'src/prisma/prisma.service';

import {
  AuthMiddleware,
} from 'src/common/middleware/auth.middleware';

import {
  AuthorizeMiddleware,
} from 'src/common/middleware/authorize.middleware';
import { AuthModule } from 'src/auth/auth.module';
import { MailModule } from 'src/common/mail/mail.module';
import { NotificationModule } from '../notification/notification.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    AuthModule,
    MailModule,
    NotificationModule,
    RedisModule,
  ],
  controllers: [
    AdminController,
  ],

  providers: [

    AdminService,

    PrismaService,
  ],
})
export class AdminModule
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
        AdminController,
      );
  }
}