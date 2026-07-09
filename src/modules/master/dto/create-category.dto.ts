import {
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Plumbing',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  name: string;
}