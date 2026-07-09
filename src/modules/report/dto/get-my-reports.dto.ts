import {
    IsEnum,
    IsOptional,
    IsString,
    IsInt,
    Min,
    Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

import { ApiPropertyOptional } from '@nestjs/swagger';

import {
    ReportReason,
    ReportStatus,
    ReportType,
} from '@prisma/client';

export class GetMyReportsDto {

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
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
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    search?: string;
}