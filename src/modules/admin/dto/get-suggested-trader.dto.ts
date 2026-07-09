import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SuggestedTradersDto {
  @ApiPropertyOptional({
    example: 50,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;

  @ApiPropertyOptional({
    example: 25,
    description:
      'Search radius in kilometers. If omitted, job current radius will be used.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  radius?: number;
}