import {
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
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
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({
    example: 'Private Limited',
  })
  @IsOptional()
  @IsString()
  companyType?: string;

  @ApiPropertyOptional({
    example: 'REG123456',
  })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({
    example: ['service-1', 'service-2'],
    type: [String],
  })

  @Transform(({ value }) => {

    if (Array.isArray(value)) {
      return value;
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
  skillServiceIds?: string[];

  @ApiPropertyOptional({
    example: ['sub-category-1', 'sub-category-2'],
    type: [String],
  })

  @Transform(({ value }) => {

    if (Array.isArray(value)) {
      return value;
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
  subCategoryIds?: string[];

  @ApiPropertyOptional({
    example:
      'Professional plumbing services',
  })
  @IsOptional()
  @IsString()
  about?: string;

  @ApiPropertyOptional({
    example: 'Dubai Marina',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    example: true,
  })
  @Transform(
    ({ value }) => value === 'true',
  )
  @IsOptional()
  @IsBoolean()
  minimumExperience?: boolean;

  @ApiPropertyOptional({
    example: true,
  })
  @Transform(
    ({ value }) => value === 'true',
  )
  @IsOptional()
  @IsBoolean()
  authorisedBusiness?: boolean;

  @ApiPropertyOptional({
    example: true,
  })
  @Transform(
    ({ value }) => value === 'true',
  )
  @IsOptional()
  @IsBoolean()
  understandVettingPolicy?: boolean;

  @ApiPropertyOptional({
    example: true,
  })
  @Transform(
    ({ value }) => value === 'true',
  )
  @IsOptional()
  @IsBoolean()
  acceptedPrivacyPolicy?: boolean;

  @ApiPropertyOptional({
    example: true,
  })
  @Transform(
    ({ value }) => value === 'true',
  )
  @IsOptional()
  @IsBoolean()
  acceptedTermsConditions?: boolean;
}