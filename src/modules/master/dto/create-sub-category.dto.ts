import {
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';

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
  @IsString()
  @IsNotEmpty()
  name: string;
}