import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class TraderCategorySelectionDto {
  @ApiPropertyOptional({
    description: 'Optional trader ID (defaults to authenticated trader profile if omitted)',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
  })
  @IsOptional()
  @IsString({ message: 'traderId must be a string' })
  @IsUUID('all', { message: 'traderId must be a valid UUID' })
  traderId?: string;

  @ApiProperty({
    description: 'Target subscription plan ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
  })
  @IsNotEmpty({ message: 'planId is required' })
  @IsString({ message: 'planId must be a string' })
  @IsUUID('all', { message: 'planId must be a valid UUID' })
  planId: string;

  @ApiProperty({
    description: 'Selected trade category IDs',
    example: ['categoryId1', 'categoryId2'],
    type: [String],
  })
  @IsArray({ message: 'tradeCategories must be an array' })
  @IsUUID('all', { each: true, message: 'Each tradeCategory must be a valid UUID' })
  tradeCategories: string[];

  @ApiPropertyOptional({
    description: 'Selected skill service IDs under the chosen trade categories',
    example: ['serviceId1', 'serviceId2'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'skillsServices must be an array' })
  @IsUUID('all', { each: true, message: 'Each skillService must be a valid UUID' })
  skillsServices?: string[];

  @ApiPropertyOptional({
    description: 'Selected subcategory IDs under the chosen skill services',
    example: ['subcategoryId1', 'subcategoryId2'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'subCategories must be an array' })
  @IsUUID('all', { each: true, message: 'Each subCategory must be a valid UUID' })
  subCategories?: string[];
}
