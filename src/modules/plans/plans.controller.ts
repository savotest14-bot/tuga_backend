// plans.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import { PlansService } from './plans.service';

import { UpdatePlanDto } from './dto/update-plan.dto';

@ApiTags('Admin Plans')

@ApiBearerAuth('access-token')

// CHANGE THIS
@Controller('admin-plan')
export class PlansController {
  constructor(
    private readonly plansService: PlansService,
  ) {}

  /*
  |--------------------------------------------------------------------------
  | GET ALL PLANS
  |--------------------------------------------------------------------------
  */

  @Get()
  async getAllPlans() {
    return this.plansService.getAllPlans();
  }

  /*
  |--------------------------------------------------------------------------
  | UPDATE PLAN
  |--------------------------------------------------------------------------
  */

  @Patch(':id')
  async updatePlan(
    @Param('id', ParseUUIDPipe)
    id: string,

    @Body()
    dto: UpdatePlanDto,
  ) {
    return this.plansService.updatePlan(
      id,
      dto,
    );
  }
}