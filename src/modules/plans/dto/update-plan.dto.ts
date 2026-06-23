import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePlanDto {
  @ApiPropertyOptional({
    example: 'Updated Bronze Plan',
  })
  @IsOptional()
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
  monthlyPrice?: number;

  @ApiPropertyOptional({
    example: 149.99,
  })
  @IsOptional()
  @IsNumber()
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