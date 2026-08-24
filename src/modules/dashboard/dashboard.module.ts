import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TraderDashboardController } from './trader-dashboard.controller';
import { TraderDashboardService } from './trader-dashboard.service';
import { CustomerDashboardController } from './customer-dashboard.controller';
import { CustomerDashboardService } from './customer-dashboard.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { SocketModule } from 'src/socket/socket.module';
import { AuthMiddleware } from 'src/common/middleware/auth.middleware';

@Module({
    imports: [PrismaModule, AuthModule, SocketModule],
    controllers: [TraderDashboardController, CustomerDashboardController],
    providers: [TraderDashboardService, CustomerDashboardService],
    exports: [TraderDashboardService, CustomerDashboardService],
})
export class DashboardModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(AuthMiddleware)
            .forRoutes(TraderDashboardController, CustomerDashboardController);
    }
}
