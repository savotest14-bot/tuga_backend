import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { DirectJobService } from './direct-job.service';
import { CancelDirectJobDto } from './dto/cancel-direct-job.dto';
import { GetDirectJobsQueryDto } from './dto/get-direct-jobs-query.dto';
import { StartDirectJobDto } from './dto/start-direct-job.dto';

@ApiTags('Direct Jobs')
@ApiBearerAuth('access-token')
@Controller('direct-jobs')
export class DirectJobController {
  constructor(private readonly directJobService: DirectJobService) {}

  /*
  |--------------------------------------------------------------------------
  | GET CONVERSATION DIRECT JOB
  |--------------------------------------------------------------------------
  */
  @Get('conversation/:conversationId')
  @ApiOperation({
    summary: 'Get active or latest direct job in a conversation',
  })
  @ApiParam({
    name: 'conversationId',
    type: String,
    description: 'Conversation UUID',
  })
  async getConversationDirectJob(
    @Req() req: Request,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.directJobService.getConversationDirectJob(
      conversationId,
      req['user'].id,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | GET MY DIRECT JOBS
  |--------------------------------------------------------------------------
  */
  @Get('my-jobs')
  @ApiOperation({
    summary: 'Get paginated list of direct jobs for logged-in user',
  })
  async getMyDirectJobs(
    @Req() req: Request,
    @Query() query: GetDirectJobsQueryDto,
  ) {
    return this.directJobService.getMyDirectJobs(req['user'].id, query);
  }

  /*
  |--------------------------------------------------------------------------
  | START DIRECT JOB (TRADER)
  |--------------------------------------------------------------------------
  */
  @Post('start')
  @ApiOperation({
    summary: 'Trader starts a job directly from conversation without posting',
  })
  async startDirectJob(
    @Req() req: Request,
    @Body() dto: StartDirectJobDto,
  ) {
    return this.directJobService.startDirectJob(req['user'].id, dto);
  }

  /*
  |--------------------------------------------------------------------------
  | CLOSE DIRECT JOB (TRADER MARKS COMPLETE)
  |--------------------------------------------------------------------------
  */
  @Patch(':id/close')
  @ApiOperation({
    summary: 'Trader marks direct job as complete (awaiting customer confirmation)',
  })
  @ApiParam({ name: 'id', type: String, description: 'Direct job UUID' })
  async closeDirectJob(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.directJobService.closeDirectJob(req['user'].id, id);
  }

  /*
  |--------------------------------------------------------------------------
  | REMIND CUSTOMER (TRADER)
  |--------------------------------------------------------------------------
  */
  @Post(':id/remind')
  @ApiOperation({
    summary: 'Trader sends reminder to customer to confirm completed job',
  })
  @ApiParam({ name: 'id', type: String, description: 'Direct job UUID' })
  async remindCustomer(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.directJobService.remindCustomer(req['user'].id, id);
  }

  /*
  |--------------------------------------------------------------------------
  | CONFIRM DIRECT JOB (CUSTOMER)
  |--------------------------------------------------------------------------
  */
  @Patch(':id/confirm')
  @ApiOperation({
    summary: 'Customer confirms completion of direct job (ready for review)',
  })
  @ApiParam({ name: 'id', type: String, description: 'Direct job UUID' })
  async confirmDirectJob(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.directJobService.confirmDirectJob(req['user'].id, id);
  }

  /*
  |--------------------------------------------------------------------------
  | CANCEL DIRECT JOB
  |--------------------------------------------------------------------------
  */
  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel a direct job (by customer or trader before completion)',
  })
  @ApiParam({ name: 'id', type: String, description: 'Direct job UUID' })
  async cancelDirectJob(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelDirectJobDto,
  ) {
    return this.directJobService.cancelDirectJob(
      req['user'].id,
      id,
      dto,
      req['user'].role === 'ADMIN',
    );
  }

  /*
  |--------------------------------------------------------------------------
  | GET DIRECT JOB BY ID
  |--------------------------------------------------------------------------
  */
  @Get(':id')
  @ApiOperation({
    summary: 'Get single direct job details by ID',
  })
  @ApiParam({ name: 'id', type: String, description: 'Direct job UUID' })
  async getDirectJobById(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.directJobService.getDirectJobById(
      req['user'].id,
      id,
      req['user'].role,
    );
  }
}
