import {
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

import {
  ReportReason,
  ReportStatus,
  ReportType,
} from '@prisma/client';

export class GetReportsDto {
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsEnum(ReportType)
  reportType?: ReportType;

  @IsOptional()
  @IsEnum(ReportReason)
  reason?: ReportReason;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}