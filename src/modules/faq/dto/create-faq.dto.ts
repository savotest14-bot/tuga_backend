import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export enum FaqAudience {
  CUSTOMER = 'CUSTOMER',
  TRADER = 'TRADER',
  BOTH = 'BOTH',
}

export class CreateFaqDto {
  @ApiProperty({
    example: 'How do I create an account?',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    example: 'You can create an account by clicking Sign Up.',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiPropertyOptional({
    enum: FaqAudience,
    example: FaqAudience.CUSTOMER,
  })
  @IsEnum(FaqAudience)
  @IsOptional()
  audience?: FaqAudience;

  @ApiPropertyOptional({
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 1,
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}