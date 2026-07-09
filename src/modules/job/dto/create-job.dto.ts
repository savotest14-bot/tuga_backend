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

export class CreateJobDto {

  @IsUUID()
  categoryId: string;

  @IsUUID()
  skillServiceId: string;

  @IsOptional()
  @IsUUID()
  subCategoryId?: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  postcode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(5, 150)
  title: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(10, 2000)
  description: string;

  @IsEnum(JobTimescale)
  timescale: JobTimescale;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  emergency?: boolean;

  @IsOptional()
  @IsEnum(BudgetRange)
  budgetRange?: BudgetRange;
}