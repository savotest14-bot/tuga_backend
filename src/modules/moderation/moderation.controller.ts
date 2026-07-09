import {
  Controller,
  Get,
  Patch,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ModerationService } from './moderation.service';

@ApiTags('Moderation')
@ApiBearerAuth('access-token')
@Controller('moderation')
export class ModerationController {
  constructor(
    private readonly moderationService: ModerationService,
  ) {}

  @Get('flags')
  @ApiOperation({
    summary:
      'Get all pending moderation flags',
  })
  @ApiResponse({
    status: 200,
    description:
      'Pending moderation flags fetched successfully',
  })
  async getFlags() {
    return this.moderationService.getPendingFlags();
  }

  @Patch('flags/:id/approve')
  @ApiOperation({
    summary:
      'Approve a moderation flag',
  })
  @ApiParam({
    name: 'id',
    description: 'Content Flag ID',
    example:
      'a4f8d5b2-1234-5678-9abc-1234567890ab',
  })
  @ApiResponse({
    status: 200,
    description:
      'Flag approved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Flag not found',
  })
  async approveFlag(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.moderationService.approveFlag(
      id,
    );
  }

  @Patch('flags/:id/reject')
  @ApiOperation({
    summary:
      'Reject a moderation flag',
  })
  @ApiParam({
    name: 'id',
    description: 'Content Flag ID',
    example:
      'a4f8d5b2-1234-5678-9abc-1234567890ab',
  })
  @ApiResponse({
    status: 200,
    description:
      'Flag rejected successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Flag not found',
  })
  async rejectFlag(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.moderationService.rejectFlag(
      id,
    );
  }
}