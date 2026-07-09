import {
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateCategoryDto {
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  name?: string;
}