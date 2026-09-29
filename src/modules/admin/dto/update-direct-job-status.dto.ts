import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DirectJobStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class UpdateDirectJobStatusDto {
  @ApiProperty({
    description: 'Target direct job status',
    enum: DirectJobStatus,
  })
  @IsEnum(DirectJobStatus)
  status: DirectJobStatus;

  @ApiPropertyOptional({
    description: 'Reason for status update or cancellation',
    example: 'Resolved dispute in customer favor',
  })
  @IsOptional()
  @IsString()
  @Length(2, 500)
  reason?: string;
}
