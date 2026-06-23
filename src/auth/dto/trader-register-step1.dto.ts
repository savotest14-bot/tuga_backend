import {
    IsEmail,
    IsNotEmpty,
    MinLength,
    IsBoolean,
    Equals,
    IsOptional,
    IsString,
    IsInt,
    IsArray,
} from 'class-validator';

import { Type } from 'class-transformer';

import {
    ApiProperty,
    ApiPropertyOptional,
} from '@nestjs/swagger';

export class TraderRegisterStep1Dto {

  @ApiProperty({
    example: 'John Doe',
  })
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    example: 'john@test.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '+97123456789',
  })
  @IsNotEmpty()
  contactNumber: string;

  @ApiProperty({
    example: '123456',
  })
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: '123456',
  })
  @MinLength(6)
  confirmPassword: string;

  @ApiPropertyOptional({
    example: [
      'category-id-1',
      'category-id-2',
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  tradeCategories?: string[];

  @ApiPropertyOptional({
    example: 25,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  workRadius?: number;

  // Coordinates

  @ApiPropertyOptional({
    example: 25.2048,
  })
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({
    example: 55.2708,
  })
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  @Equals(true)
  isCheckedTermsCondition: boolean;
}