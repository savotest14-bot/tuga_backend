import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    example: '123456',
  })
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;
}