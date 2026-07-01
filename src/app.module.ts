import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { BullModule } from '@nestjs/bullmq';


import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';

import { ServeStaticModule } from '@nestjs/serve-static';

import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';

import { UsersModule } from './modules/users/users.module';

import { AdminSeeder } from './common/seeder/admin.seeder';

import { SubscriptionPlanSeeder } from './common/seeder/subscription-plan.seeder';

import { AuthModule } from './auth/auth.module';

import { RedisModule } from './redis/redis.module';

import { MasterModule } from './modules/master/master.module';
import { PlansModule } from './modules/plans/plans.module';
import { MailModule } from './common/mail/mail.module';
import { AdminModule } from './modules/admin/admin.module';
import { CustomerModule } from './modules/customer/customer.module';
import { JobModule } from './modules/job/job.module';
import { TraderMatchingModule } from './modules/trader-matching/trader-matching.module';
import { QuoteModule } from './modules/quote/quote.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ChatModule } from './modules/chat/chat.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ReviewModule } from './modules/review/review.module';
import { ContactModule } from './modules/contact/contact.module';
import { ReportModule } from './modules/report/report.module';
import { FaqModule } from './modules/faq/faq.module';
import { ViolationKeywordSeeder } from './common/seeder/violation-keyword.seeder';
import { ModerationModule } from './modules/moderation/moderation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || '127.0.0.1',
          port: Number(configService.get('REDIS_PORT')) || 6379,
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
    }),
    // Static Uploads
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    PrismaModule,

    RedisModule,

    UsersModule,

    AuthModule,

    MasterModule,

    PlansModule,

    MailModule,

    AdminModule,

    CustomerModule,

    JobModule,

    TraderMatchingModule,

    QuoteModule,

    ChatModule,

    ConversationModule,

    NotificationModule,

    ReviewModule,

    ContactModule,

    ReportModule,

    FaqModule,

    ModerationModule,

  ],

  controllers: [AppController],

  providers: [
    AppService,
    AdminSeeder,
    SubscriptionPlanSeeder,
    ViolationKeywordSeeder,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule { }