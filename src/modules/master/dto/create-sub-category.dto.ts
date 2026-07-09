import {
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

export class CreateSubCategoryDto {
  @ApiProperty({
    example: 'skill-service-uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  skillServiceId: string;

  @ApiProperty({
    example:
      'Bathroom Pipe Installation',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  name: string;
}