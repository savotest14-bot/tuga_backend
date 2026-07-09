import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Max,
  Length,
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
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  skillServiceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subCategoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  postcode?: string;

  @ApiPropertyOptional({
    example: 23.2599,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    example: 77.4126,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(5, 150)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(10, 2000)
  description?: string;

  @ApiPropertyOptional({
    enum: JobTimescale,
  })
  @IsOptional()
  @IsEnum(JobTimescale)
  timescale?: JobTimescale;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
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
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  replaceFiles?: boolean;
}