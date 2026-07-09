import {
  IsArray,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class UpdateTraderAssetsDto {
  @ApiProperty({
    example: 'We are a professional construction company.',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  aboutUs: string;

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  @IsOptional()
  portfolioImages?: any[];

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  @IsOptional()
  portfolioVideos?: any[];

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  @IsOptional()
  certificates?: any[];

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  @IsOptional()
  insuranceDocuments?: any[];
}