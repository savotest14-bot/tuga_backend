import {
  IsEmail,
  IsNotEmpty,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'john@test.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456',
  })
  @IsNotEmpty()
  password: string;
}