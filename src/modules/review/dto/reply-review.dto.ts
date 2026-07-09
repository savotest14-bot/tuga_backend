import {
  IsString,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';

import {
  ApiProperty,
} from '@nestjs/swagger';

export class ReplyReviewDto {

  @ApiProperty({
    example:
      'Thank you for your feedback. We appreciate your support.',
    minLength: 1,
    maxLength: 500,
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(1, 500)
  reply: string;
}