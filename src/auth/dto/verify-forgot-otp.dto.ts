import { ApiProperty } from '@nestjs/swagger';

import {
  IsEmail,
  IsString,
} from 'class-validator';

export class VerifyForgotOtpDto {
  @ApiProperty({
    example: 'test@gmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456',
  })
  @IsString()
  otp: string;
}