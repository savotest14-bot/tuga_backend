import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AuthMiddleware } from 'src/common/middleware/auth.middleware';
import { DashboardModule } from 'src/modules/dashboard/dashboard.module';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisModule } from 'src/redis/redis.module';
import { SocketModule } from 'src/socket/socket.module';
import { DirectJobController } from './direct-job.controller';
import { DirectJobService } from './direct-job.service';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    AuthModule,
    NotificationModule,
    SocketModule,
    DashboardModule,
  ],
  controllers: [DirectJobController],
  providers: [DirectJobService],
  exports: [DirectJobService],
})
export class DirectJobModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(DirectJobController);
  }
}
