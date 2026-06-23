import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { AuthMiddleware } from 'src/common/middleware/auth.middleware';
import { AuthorizeMiddleware } from 'src/common/middleware/authorize.middleware';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
   imports: [
      AuthModule,
      NotificationModule,
      RedisModule,
    ],
  controllers: [ReportController],
  providers: [ReportService]
})

export class ReportModule
  implements NestModule {
  configure(
    consumer: MiddlewareConsumer,
  ) {
    // Authentication Middleware
    consumer
      .apply(AuthMiddleware)
      .forRoutes(ReportController);

    // Authorization Middleware
    consumer
      .apply(
        AuthorizeMiddleware('ADMIN'),
      )
      .forRoutes(
      {
        path: 'report/admin',
        method: RequestMethod.GET,
      },
      {
        path: 'report/admin/:id',
        method: RequestMethod.GET,
      },
      {
        path: 'report/admin/:id/status',
        method: RequestMethod.PATCH,
      },
    );
  }
}
