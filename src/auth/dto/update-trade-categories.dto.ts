import {
  IsArray,
  IsOptional,
  IsUUID,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTraderCategoriesDto {
  @ApiPropertyOptional({
    example: [
      'trade-category-id-1',
      'trade-category-id-2',
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  tradeCategories?: string[];

  @ApiPropertyOptional({
    example: [
      'sub-category-id-1',
      'sub-category-id-2',
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  subCategoryIds?: string[];

  @ApiPropertyOptional({
    example: [
      'skill-service-id-1',
      'skill-service-id-2',
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  skillServiceIds?: string[];
}