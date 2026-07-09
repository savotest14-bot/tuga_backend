import {
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
  IsUUID,
} from 'class-validator';

import {
  Transform,
} from 'class-transformer';

import {
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class TraderRegisterStep2Dto {

  @ApiPropertyOptional({
    example: 'ABC Plumbing Ltd',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({
    example: 'Private Limited',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsOptional()
  @IsString()
  companyType?: string;

  @ApiPropertyOptional({
    example: 'REG123456',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({
    example: ['service-1', 'service-2'],
    type: [String],
  })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map(item => typeof item === 'string' ? item.trim() : item).filter(Boolean);
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  skillServiceIds?: string[];

  @ApiPropertyOptional({
    example: ['sub-category-1', 'sub-category-2'],
    type: [String],
  })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map(item => typeof item === 'string' ? item.trim() : item).filter(Boolean);
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  subCategoryIds?: string[];

  @ApiPropertyOptional({
    example:
      'Professional plumbing services',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsOptional()
  @IsString()
  about?: string;

  @ApiPropertyOptional({
    example: 'Dubai Marina',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    example: true,
  })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsOptional()
  @IsBoolean()
  minimumExperience?: boolean;

  @ApiPropertyOptional({
    example: true,
  })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsOptional()
  @IsBoolean()
  authorisedBusiness?: boolean;

  @ApiPropertyOptional({
    example: true,
  })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsOptional()
  @IsBoolean()
  understandVettingPolicy?: boolean;

  @ApiPropertyOptional({
    example: true,
  })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsOptional()
  @IsBoolean()
  acceptedPrivacyPolicy?: boolean;

  @ApiPropertyOptional({
    example: true,
  })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsOptional()
  @IsBoolean()
  acceptedTermsConditions?: boolean;
}