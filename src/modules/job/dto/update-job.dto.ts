import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import {
  Transform,
  Type,
} from 'class-transformer';

import {
  BudgetRange,
  JobTimescale,
} from '@prisma/client';

import {
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class UpdateJobDto {

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  skillServiceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subCategoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postcode?: string;

  @ApiPropertyOptional({
    example: 23.2599,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    example: 77.4126,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: JobTimescale,
  })
  @IsOptional()
  @IsEnum(JobTimescale)
  timescale?: JobTimescale;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  emergency?: boolean;

  @ApiPropertyOptional({
    enum: BudgetRange,
  })
  @IsOptional()
  @IsEnum(BudgetRange)
  budgetRange?: BudgetRange;

  /*
  |--------------------------------------------------------------------------
  | REPLACE OLD FILES
  |--------------------------------------------------------------------------
  */

  @ApiPropertyOptional({
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  replaceFiles?: boolean;
}