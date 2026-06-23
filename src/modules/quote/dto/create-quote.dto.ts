import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  IsInt,
} from 'class-validator';

import { Type } from 'class-transformer';

import {
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class CreateQuoteDto {

  @ApiPropertyOptional({
    example: 5000,
    description: 'Quote price (0.01 to 999999.99)'
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(999999.99)
  price?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Estimated days to complete (1 to 365)'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  estimatedDays?: number;

  @ApiPropertyOptional({
    example: 'I can complete this work quickly',
  })
  @IsOptional()
  @IsString()
  message?: string;
}