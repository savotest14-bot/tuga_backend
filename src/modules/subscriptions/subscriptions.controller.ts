import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { SubscriptionsService } from './subscriptions.service';
import { ChangePlanDto } from './dto/change-plan.dto';

@ApiTags('Subscriptions')
@ApiBearerAuth('access-token')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  /*
  |--------------------------------------------------------------------------
  | CHANGE SUBSCRIPTION PLAN
  |--------------------------------------------------------------------------
  */
  @Patch('change-plan')
  @ApiOperation({
    summary: 'Upgrade, downgrade or switch subscription plan during trial',
  })
  async changePlan(
    @Req() req: Request,
    @Body() dto: ChangePlanDto,
  ) {
    const userId = (req as any).user.id;
    return this.subscriptionsService.changePlan(userId, dto);
  }

  /*
  |--------------------------------------------------------------------------
  | CANCEL PENDING DOWNGRADE
  |--------------------------------------------------------------------------
  */
  @Delete('cancel-pending-downgrade')
  @ApiOperation({
    summary: 'Cancel a pending scheduled subscription downgrade',
  })
  async cancelPendingDowngrade(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.subscriptionsService.cancelPendingDowngrade(userId);
  }

  /*
  |--------------------------------------------------------------------------
  | GET MY SUBSCRIPTION
  |--------------------------------------------------------------------------
  */
  @Get('my-subscription')
  @ApiOperation({
    summary: 'Get trader active and pending subscription details',
  })
  async getMySubscription(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.subscriptionsService.getMySubscription(userId);
  }

  /*
  |--------------------------------------------------------------------------
  | PROCESS RENEWALS (TRIGGER / ADMIN)
  |--------------------------------------------------------------------------
  */
  @Post('process-renewals')
  @ApiOperation({
    summary: 'Process pending subscription renewals and trial expirations',
  })
  async processRenewals() {
    return this.subscriptionsService.processRenewals();
  }
}
