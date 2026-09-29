import { ApiPropertyOptional } from '@nestjs/swagger';
import { DirectJobStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetAdminDirectJobsQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by direct job status',
    enum: DirectJobStatus,
  })
  @IsOptional()
  @IsEnum(DirectJobStatus)
  status?: DirectJobStatus;

  @ApiPropertyOptional({
    description: 'Search by customer/trader name, email, or job title',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter from creation date (ISO string)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter to creation date (ISO string)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
