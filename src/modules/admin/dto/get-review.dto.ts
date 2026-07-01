import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  ReviewModerationType,
  ReviewStatus,
  ReviewType,
} from '@prisma/client';

export class GetReviewsDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
    default: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of records per page',
    default: 10,
  })
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  limit: number = 10;

  @ApiPropertyOptional({
    enum: ReviewStatus,
    description: 'Filter by review status',
  })
  @IsEnum(ReviewStatus)
  @IsOptional()
  status?: ReviewStatus;

  @ApiPropertyOptional({
    enum: ReviewType,
    description: 'Filter by review type',
  })
  @IsEnum(ReviewType)
  @IsOptional()
  reviewType?: ReviewType;

  @ApiPropertyOptional({
    enum: ReviewModerationType,
    description: 'Filter by moderation type',
  })
  @IsEnum(ReviewModerationType)
  @IsOptional()
  moderationType?: ReviewModerationType;
}