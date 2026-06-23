import {
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateSkillServiceDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  name?: string;
}