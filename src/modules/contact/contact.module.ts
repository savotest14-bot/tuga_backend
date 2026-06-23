import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
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
  controllers: [ContactController],
  providers: [ContactService]
})

export class ContactModule
  implements NestModule {
  configure(
    consumer: MiddlewareConsumer,
  ) {
    // Authentication Middleware
    consumer
      .apply(AuthMiddleware)
      .forRoutes(ContactController);

    // Authorization Middleware
    consumer
      .apply(
        AuthorizeMiddleware('ADMIN'),
      )
      .forRoutes(
      {
        path: 'contact/:id/status',
        method: RequestMethod.PATCH,
      },
    );
  }
}