import {
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldPassword@123',
  })
  @IsString()
  oldPassword: string;

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
  newPassword: string;

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