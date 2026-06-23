import {
  ApiPropertyOptional,
} from '@nestjs/swagger';

import {
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateConversationDto {

  @ApiPropertyOptional({
    example:
      '69213d76-2979-45d2-a959-1440d3979461',
  })

  @IsOptional()

  @IsUUID()

  jobId?: string;
}