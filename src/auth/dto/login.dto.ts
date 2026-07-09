import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'john@test.com',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}