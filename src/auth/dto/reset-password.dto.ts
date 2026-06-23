import { ApiProperty } from '@nestjs/swagger';

import {
  IsString,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  resetToken: string;

  @ApiProperty({
    example: 'NewPassword@123',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'NewPassword@123',
  })
  @IsString()
  confirmPassword: string;
}