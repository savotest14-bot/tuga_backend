import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

import { Type } from 'class-transformer';

import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

import {
  ReviewInteractionSource,
  ReviewType,
  NoWorkReason,
} from '@prisma/client';

export class CreateReviewDto {

  @ApiProperty()
  @IsUUID()
  traderId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  jobId?: string;

  @ApiProperty({
    enum: ReviewType,
  })
  @IsEnum(ReviewType)
  reviewType: ReviewType;

  @ApiPropertyOptional({
    enum: ReviewInteractionSource,
  })
  @IsOptional()
  @IsEnum(ReviewInteractionSource)
  interactionSource?: ReviewInteractionSource;

  @ApiProperty()
  @Type(() => Boolean)
  @IsBoolean()
  wasWorkCompleted: boolean;

  /*
  |--------------------------------------------------------------------------
  | WORK COMPLETED
  |--------------------------------------------------------------------------
  */

  @ApiProperty({
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional()
  @ValidateIf(
    (o) => o.wasWorkCompleted === true,
  )
  @IsString()
  @Length(1, 120)
  title?: string;

  @ApiPropertyOptional()
  @ValidateIf(
    (o) => o.wasWorkCompleted === true,
  )
  @IsString()
  @Length(1, 1000)
  review?: string;

  @ApiPropertyOptional({
    example: '2026-06-11',
  })
  @ValidateIf(
    (o) => o.wasWorkCompleted === true,
  )
  @IsDateString()
  workCompletedDate?: string;

  @ApiPropertyOptional({
    example: true,
  })
  @ValidateIf(
    (o) => o.wasWorkCompleted === true,
  )
  @Type(() => Boolean)
  @IsBoolean()
  wouldRecommendTrader?: boolean;

  /*
  |--------------------------------------------------------------------------
  | WORK NOT COMPLETED
  |--------------------------------------------------------------------------
  */

  @ApiPropertyOptional({
    enum: NoWorkReason,
  })
  @ValidateIf(
    (o) => o.wasWorkCompleted === false,
  )
  @IsEnum(NoWorkReason)
  noWorkReason?: NoWorkReason;

  @ApiPropertyOptional()
  @ValidateIf(
    (o) =>
      o.wasWorkCompleted === false &&
      o.noWorkReason === NoWorkReason.OTHER,
  )
  @IsString()
  @Length(1, 500)
  noWorkReasonText?: string;
}