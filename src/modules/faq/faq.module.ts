import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { FaqController } from './faq.controller';
import { FaqService } from './faq.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { AuthMiddleware } from 'src/common/middleware/auth.middleware';
import { AuthorizeMiddleware } from 'src/common/middleware/authorize.middleware';
import { AuthModule } from 'src/auth/auth.module';
import { MailModule } from 'src/common/mail/mail.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    AuthModule,
    MailModule,
    RedisModule,
  ],
  controllers: [FaqController],
  providers: [
    FaqService,
    PrismaService
  ],
})
export class FaqModule
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
      .exclude(
        {
          path: 'faq/public',
          method: RequestMethod.GET,
        },
      )

      .forRoutes(
        FaqController,
      );
  }
}