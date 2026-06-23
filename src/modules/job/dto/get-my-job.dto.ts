import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetMyJobsDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Number of records per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Search by job title or keyword',
    example: 'developer',
  })
  @IsOptional()
  @IsString()
  search?: string;
}