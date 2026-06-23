import {
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateSubCategoryDto {
  @IsOptional()
  @IsString()
  skillServiceId?: string;

  @IsOptional()
  @IsString()
  name?: string;
}