import { ApiProperty } from '@nestjs/swagger';

import {
  IsEmail,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'test@gmail.com',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail()
  @MaxLength(255)
  email: string;
}