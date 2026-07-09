import { ApiProperty } from '@nestjs/swagger';

import {
  IsEmail,
  IsString,
  MaxLength,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class VerifyForgotOtpDto {
  @ApiProperty({
    example: 'test@gmail.com',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    example: '123456',
  })
  @IsString()
  @Length(6, 6)
  otp: string;
}