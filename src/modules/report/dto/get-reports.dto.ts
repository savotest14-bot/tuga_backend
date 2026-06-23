import {
  IsEnum,
  IsOptional,
} from 'class-validator';

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
  page?: number = 1;

  @IsOptional()
  limit?: number = 10;
}