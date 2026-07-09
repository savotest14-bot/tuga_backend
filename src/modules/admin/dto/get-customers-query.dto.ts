import { Type, Transform } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetCustomersQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE', 'BLOCKED', 'PENDING'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'BLOCKED', 'PENDING'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  search?: string;
}
