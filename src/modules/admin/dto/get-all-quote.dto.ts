import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min, Max } from 'class-validator';
import { QuoteStatus } from '@prisma/client';

export class GetAllQuotesDto {
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: QuoteStatus,
  })
  @IsEnum(QuoteStatus)
  @IsOptional()
  status?: QuoteStatus;
}