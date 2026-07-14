// customer.module.ts

import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

import {
  CustomerService,
} from './customer.service';

import {
  CustomerController,
} from './customer.controller';

import {
  PrismaService,
} from 'src/prisma/prisma.service';


import {
  AuthMiddleware,
} from 'src/common/middleware/auth.middleware';
import { AuthModule } from 'src/auth/auth.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({

  imports: [
    AuthModule,
    RedisModule,
  ],

  controllers: [
    CustomerController,
  ],

  providers: [

    CustomerService,

    PrismaService,
  ],
})
export class CustomerModule
  implements NestModule
{
  configure(
    consumer: MiddlewareConsumer,
  ) {

    consumer

      .apply(
        AuthMiddleware,
      ) .exclude(
              {
                path: 'customer/search-traders',
                method: RequestMethod.GET,
              },
               {
                path: 'customer/public/traders/:traderId',
                method: RequestMethod.GET,
              },
            )

      .forRoutes(
        CustomerController,
      );
  }
}