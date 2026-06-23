import {
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';

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
  @IsString()
  @IsNotEmpty()
  name: string;
}