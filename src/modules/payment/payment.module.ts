import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { StripeService } from './stripe.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { AuthModule } from 'src/auth/auth.module';
import { AuthMiddleware } from 'src/common/middleware/auth.middleware';

@Module({
  imports: [PrismaModule, NotificationModule, AuthModule],
  controllers: [PaymentController],
  providers: [PaymentService, StripeService],
  exports: [PaymentService, StripeService],
})
export class PaymentModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'api/payments/config', method: RequestMethod.GET },
        { path: 'payments/config', method: RequestMethod.GET },
        { path: 'api/payments/webhook', method: RequestMethod.POST },
        { path: 'payments/webhook', method: RequestMethod.POST },
      )
      .forRoutes(PaymentController);
  }
}
