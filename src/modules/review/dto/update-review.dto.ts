import {
    IsBoolean,
    IsNumber,
    IsOptional,
    IsString,
    Length,
    Max,
    Min,
    IsEnum,
    IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NoWorkReason } from '@prisma/client';

export class UpdateReviewDto {
    @ApiPropertyOptional({
        example: 4,
        minimum: 1,
        maximum: 5,
        type: Number,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(5)
    rating?: number;

    @ApiPropertyOptional({
        example: 'Great experience',
        maxLength: 120,
        type: String,
    })
    @IsOptional()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    @Length(0, 120)
    title?: string;

    @ApiPropertyOptional({
        example: 'Trader was professional and completed the work on time.',
        maxLength: 1000,
        type: String,
    })
    @IsOptional()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    @Length(0, 1000)
    review?: string;

    @ApiPropertyOptional({
        example: true,
        type: Boolean,
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return value;
    })
    @IsBoolean()
    wasWorkCompleted?: boolean;

    @ApiPropertyOptional({
        example: '2026-06-11',
        type: String,
        format: 'date',
    })
    @IsOptional()
    @IsDateString()
    workCompletedDate?: string;

    @ApiPropertyOptional({
        example: true,
        type: Boolean,
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return value;
    })
    @IsBoolean()
    wouldRecommendTrader?: boolean;

    @ApiPropertyOptional({
        enum: NoWorkReason,
        enumName: 'NoWorkReason',
    })
    @IsOptional()
    @IsEnum(NoWorkReason)
    noWorkReason?: NoWorkReason;

    @ApiPropertyOptional({
        example: 'Trader cancelled twice',
        type: String,
    })
    @IsOptional()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    @Length(1, 500)
    noWorkReasonText?: string;

    @ApiPropertyOptional({
        example: false,
        description:
            'If true, old proof files will be removed and replaced with new uploaded files.',
        type: Boolean,
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return value;
    })
    @IsBoolean()
    replaceProofs?: boolean;
}