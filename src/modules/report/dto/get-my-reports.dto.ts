import {
    IsEnum,
    IsOptional,
    IsString,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

import {
    ReportReason,
    ReportStatus,
    ReportType,
} from '@prisma/client';

export class GetMyReportsDto {

    @ApiPropertyOptional()
    @IsOptional()
    page?: number = 1;

    @ApiPropertyOptional()
    @IsOptional()
    limit?: number = 10;

    @ApiPropertyOptional({
        enum: ReportType,
    })
    @IsOptional()
    @IsEnum(ReportType)
    reportType?: ReportType;

    @ApiPropertyOptional({
        enum: ReportStatus,
    })
    @IsOptional()
    @IsEnum(ReportStatus)
    status?: ReportStatus;

    @ApiPropertyOptional({
        enum: ReportReason,
    })
    @IsOptional()
    @IsEnum(ReportReason)
    reason?: ReportReason;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    search?: string;
}