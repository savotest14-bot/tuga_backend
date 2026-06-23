// plans.module.ts

import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

import { PlansController } from './plans.controller';

import { PlansService } from './plans.service';

import { PrismaModule } from '../../prisma/prisma.module';

import { AuthModule } from '../../auth/auth.module';

import { AuthMiddleware } from '../../common/middleware/auth.middleware';

import { AuthorizeMiddleware } from '../../common/middleware/authorize.middleware';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    AuthModule,
  ],

  controllers: [PlansController],

  providers: [PlansService],
})
export class PlansModule
  implements NestModule
{
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
      .forRoutes(
        PlansController,
      );

    /*
    |--------------------------------------------------------------------------
    | ADMIN AUTHORIZATION
    |--------------------------------------------------------------------------
    */

    consumer
      .apply(
        AuthorizeMiddleware(
          'ADMIN',
        ),
      )

      .forRoutes({
        // UPDATED PATH
        path: 'admin-plan/:id',

        method:
          RequestMethod.PATCH,
      });
  }
}