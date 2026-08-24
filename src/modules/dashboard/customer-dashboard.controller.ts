import { Controller, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CustomerDashboardService } from './customer-dashboard.service';
import type { Request } from 'express';

@ApiTags('Customer Dashboard')
@Controller('customer/dashboard')
export class CustomerDashboardController {
    constructor(private readonly dashboardService: CustomerDashboardService) {}

    @Get()
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get customer dashboard details' })
    async getDashboard(@Req() req: Request) {
        const data = await this.dashboardService.getDashboard(req['user'].id);
        return {
            success: true,
            data,
        };
    }
}
