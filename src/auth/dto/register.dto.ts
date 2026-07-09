import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsBoolean,
  Equals,
  IsOptional,
  IsNumber,
  IsString,
  Matches,
  MaxLength,
  Length,
  Min,
  Max,
} from 'class-validator';

import { Type, Transform } from 'class-transformer';

import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class CustomerRegisterDto {
  @ApiProperty({
    example: 'John Doe',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  fullName: string;

  @ApiProperty({
    example: 'john@test.com',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    example: 'Password@123',
  })
  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,64}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be between 8 and 64 characters long.',
    },
  )
  password: string;

  @ApiProperty({
    example: 'Password@123',
  })
  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,64}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be between 8 and 64 characters long.',
    },
  )
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
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    example: 55.2708,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}