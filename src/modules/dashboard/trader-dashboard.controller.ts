import { Controller, Get, Req, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { TraderDashboardService } from './trader-dashboard.service';
import type { Request } from 'express';

@ApiTags('Trader Dashboard')
@Controller('trader/dashboard')
export class TraderDashboardController {
    constructor(private readonly dashboardService: TraderDashboardService) {}

    @Get()
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get trader dashboard details' })
    async getDashboard(@Req() req: Request) {
        const data = await this.dashboardService.getDashboard(req['user'].id);
        return {
            success: true,
            data,
        };
    }

    @Get('customer/:customerId')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get customer details (for trader view)' })
    async getCustomerDetails(
        @Req() req: Request,
        @Param('customerId', ParseUUIDPipe) customerId: string,
    ) {
        const data = await this.dashboardService.getCustomerDetails(req['user'].id, customerId);
        return {
            success: true,
            data,
        };
    }
}
