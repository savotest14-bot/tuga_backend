import { ApiProperty } from '@nestjs/swagger';

import {
  IsString,
  MinLength,
  Matches,
  IsNotEmpty,
} from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  resetToken: string;

  @ApiProperty({
    example: 'NewPassword@123',
  })
  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,64}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be between 8 and 64 characters long.',
    },
  )
  password: string;

  @ApiProperty({
    example: 'NewPassword@123',
  })
  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,64}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be between 8 and 64 characters long.',
    },
  )
  confirmPassword: string;
}