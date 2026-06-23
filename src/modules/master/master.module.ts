import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

import { MasterController } from './master.controller';
import { MasterService } from './master.service';

import { PrismaService } from '../../prisma/prisma.service';

import { AuthModule } from '../../auth/auth.module';

import { AuthMiddleware } from '../../common/middleware/auth.middleware';

import { AuthorizeMiddleware } from '../../common/middleware/authorize.middleware';

@Module({
  imports: [AuthModule],

  controllers: [MasterController],

  providers: [
    MasterService,
    PrismaService,
  ],
})
export class MasterModule
  implements NestModule {
  configure(
    consumer: MiddlewareConsumer,
  ) {
    // Authentication Middleware
    consumer
      .apply(AuthMiddleware)
      .exclude(
        {
          path: 'master/categories',
          method: RequestMethod.GET,
        },

        {
          path: 'master/skill-services/:categoryId',
          method: RequestMethod.GET,
        },
         {
          path: 'master/sub-categories/:skillServiceId',
          method: RequestMethod.GET,
        },
      )

      .forRoutes(MasterController);

    // Authorization Middleware
    consumer
      .apply(
        AuthorizeMiddleware('ADMIN'),
      )
      .forRoutes(
        {
          path: 'master/category',
          method: RequestMethod.POST,
        },
        {
          path: 'master/skill-service',
          method: RequestMethod.POST,
        },
        {
          path: 'master/sub-category',
          method: RequestMethod.POST,
        },
        {
          path: 'master/category/:id/toggle',
          method: RequestMethod.PATCH,
        },
        {
          path: 'master/skill-service/:id/toggle',
          method: RequestMethod.PATCH,
        },
        {
          path: 'master/sub-category/:id/toggle',
          method: RequestMethod.PATCH,
        },
        {
          path: 'master/category/:id',
          method: RequestMethod.PATCH,
        },
        {
          path: 'master/skill-service/:id',
          method: RequestMethod.PATCH,
        },
        {
          path: 'master/sub-category/:id',
          method: RequestMethod.PATCH,
        },
      );
  }
}