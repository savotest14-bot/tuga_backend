import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePlanDto {
  @ApiPropertyOptional({
    example: 'Updated Bronze Plan',
  })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  description?: string;

  /*
  |--------------------------------------------------------------------------
  | PLAN LIMITS
  |--------------------------------------------------------------------------
  */

  @ApiPropertyOptional({
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxTrades?: number;

  @ApiPropertyOptional({
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  unlimitedTrades?: boolean;

  @ApiPropertyOptional({
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPortfolioUploads?: number;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  allowPortfolioVideos?: boolean;

  @ApiPropertyOptional({
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxQuotesPerDay?: number;

  /*
  |--------------------------------------------------------------------------
  | VISIBILITY & EXPOSURE
  |--------------------------------------------------------------------------
  */

  @ApiPropertyOptional({
    example: 'Silver',
  })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  bannerLabel?: string;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  featuredAtTop?: boolean;

  @ApiPropertyOptional({
    example: 'MAXIMUM',
  })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  exposureLevel?: string;

  /*
  |--------------------------------------------------------------------------
  | FEATURES
  |--------------------------------------------------------------------------
  */

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  newJobAlerts?: boolean;

  @ApiPropertyOptional({
    example: 7,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  customerSupportDays?: number;

  /*
  |--------------------------------------------------------------------------
  | TRIAL
  |--------------------------------------------------------------------------
  */

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  trialEnabled?: boolean;

  @ApiPropertyOptional({
    example: 90,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  trialDays?: number;

  /*
  |--------------------------------------------------------------------------
  | PRICES
  |--------------------------------------------------------------------------
  */

  @ApiPropertyOptional({
    example: 14.99,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyPrice?: number;

  @ApiPropertyOptional({
    example: 149.99,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  yearlyPrice?: number;

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}