import {
  IsArray,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import {
  Transform,
  Type,
} from 'class-transformer';

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
    return value;
  }

  // string handling
  if (typeof value === 'string') {

    // JSON array support
    if (value.startsWith('[')) {
      try {
        return JSON.parse(value);
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

export class UpdateProfileDto {

  /* =========================================================================
   | USER
   ========================================================================= */

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;


  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  /* =========================================================================
   | TRADER
   ========================================================================= */

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  companyType?: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @Transform(({ value }) => parseArray(value))
  @IsArray()
  tradeCategories?: string[];

  @IsOptional()
  @Transform(({ value }) => parseArray(value))
  @IsArray()
  skillsServices?: string[];

  @IsOptional()
  @Transform(({ value }) => parseArray(value))
  @IsArray()
  subCategories?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  workRadius?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  about?: string;
}