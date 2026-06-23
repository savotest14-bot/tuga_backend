import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { NotificationService } from "./notification.service";
import { Controller, Get, Patch, Query, Req } from "@nestjs/common";
import { GetNotificationsDto } from "./dto/get-my-notification.dto";
import type { Request }
    from 'express';

@ApiTags('Notification')
@ApiBearerAuth('access-token')
@Controller('notification')
export class NotificationController {

    constructor(
        private readonly notificationService: NotificationService,
    ) { }

    @Get('my-notifications')
    @ApiBearerAuth('access-token')
    async getMyNotifications(
        @Req() req: Request,
        @Query() query: GetNotificationsDto,
    ) {
        return this.notificationService.getMyNotifications(
            req['user'].id,
            query,
        );
    }

    @Patch('read-all')
    @ApiBearerAuth('access-token')
    async markAllAsRead(
        @Req() req: Request,
    ) {
        return this.notificationService.markAllAsRead(
            req['user'].id,
        );
    }
}