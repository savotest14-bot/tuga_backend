import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Plumbing',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}