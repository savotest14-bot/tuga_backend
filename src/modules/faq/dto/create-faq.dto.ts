import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
} from 'class-validator';

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
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    example: 'You can create an account by clicking Sign Up.',
  })
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
  @IsOptional()
  sortOrder?: number;
}