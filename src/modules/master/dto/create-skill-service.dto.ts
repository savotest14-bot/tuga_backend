import {
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

export class CreateSkillServiceDto {
  @ApiProperty({
    example: 'category-uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    example: 'Pipe Installation',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  name: string;
}