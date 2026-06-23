import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsBoolean,
  Equals,
  IsOptional,
  IsNumber,
  IsString,
} from 'class-validator';

import { Type } from 'class-transformer';

import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class CustomerRegisterDto {
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
    example: '123456',
  })
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: '123456',
  })
  @MinLength(6)
  confirmPassword: string;

  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  @Equals(true, {
    message:
      'You must accept terms and conditions',
  })
  isCheckedTermsCondition: boolean;

  @ApiPropertyOptional({
    example: 25.2048,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    example: 55.2708,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;
}