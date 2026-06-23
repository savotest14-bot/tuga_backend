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

export class CreateJobDto {

  @IsString()
  categoryId: string;

  @IsString()
  skillServiceId: string;

  @IsOptional()
  @IsString()
  subCategoryId?: string;

  @IsOptional()
  @IsString()
  postcode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(JobTimescale)
  timescale: JobTimescale;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  emergency?: boolean;

  @IsOptional()
  @IsEnum(BudgetRange)
  budgetRange?: BudgetRange;
}