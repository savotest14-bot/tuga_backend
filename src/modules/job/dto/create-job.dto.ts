import {
  IsArray,
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

/*
|--------------------------------------------------------------------------
| HELPER
|--------------------------------------------------------------------------
*/

function parseArray(value: any): string[] {
  if (!value) {
    return [];
  }

  // already array
  if (Array.isArray(value)) {
    return value.map(item => typeof item === 'string' ? item.trim() : item).filter(Boolean);
  }

  // string handling
  if (typeof value === 'string') {
    // JSON array support
    if (value.startsWith('[')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map(item => typeof item === 'string' ? item.trim() : item).filter(Boolean);
        }
      } catch {
        return [];
      }
    }

    // comma separated support
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export class CreateJobDto {

  @Transform(({ value }) => parseArray(value))
  @IsArray()
  @IsUUID(undefined, { each: true })
  categoryIds: string[];

  @Transform(({ value }) => parseArray(value))
  @IsArray()
  @IsUUID(undefined, { each: true })
  skillServiceIds: string[];

  @IsOptional()
  @Transform(({ value }) => parseArray(value))
  @IsArray()
  @IsUUID(undefined, { each: true })
  subCategoryIds?: string[];

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