import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetMatchedJobsDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of records per page',
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  limit: number = 10;

  @ApiPropertyOptional({
    example: 'developer',
    description: 'Search jobs by keyword',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}