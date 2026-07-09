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
  Matches,
  MaxLength,
  Length,
  Min,
  Max,
  IsUUID,
  IsNumber,
} from 'class-validator';

import { Type, Transform } from 'class-transformer';

import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class TraderRegisterStep1Dto {
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
    example: '+97123456789',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/\s+/g, '') : value)
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Invalid phone number format' })
  contactNumber: string;

  @ApiProperty({
    example: '123456',
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
    example: '123456',
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

  @ApiPropertyOptional({
    example: [
      'category-id-1',
      'category-id-2',
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  tradeCategories?: string[];

  @ApiPropertyOptional({
    example: 25,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  workRadius?: number;

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

  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  @Equals(true)
  isCheckedTermsCondition: boolean;
}