import {
  IsArray,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Length,
  Matches,
  Min,
  Max,
  IsUUID,
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

export class UpdateProfileDto {

  /* =========================================================================
   | USER
   ========================================================================= */

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(2, 100)
  fullName?: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/\s+/g, '') : value)
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Invalid phone number format' })
  phone?: string;

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

  /* =========================================================================
   | TRADER
   ========================================================================= */

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  companyName?: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  companyType?: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @Transform(({ value }) => parseArray(value))
  @IsArray()
  @IsUUID('all', { each: true })
  tradeCategories?: string[];

  @IsOptional()
  @Transform(({ value }) => parseArray(value))
  @IsArray()
  @IsUUID('all', { each: true })
  skillsServices?: string[];

  @IsOptional()
  @Transform(({ value }) => parseArray(value))
  @IsArray()
  @IsUUID('all', { each: true })
  subCategories?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  workRadius?: number;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  location?: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  about?: string;
}