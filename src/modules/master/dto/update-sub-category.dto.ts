import {
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateSubCategoryDto {
  @IsOptional()
  @IsUUID()
  skillServiceId?: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  name?: string;
}