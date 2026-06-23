import {
  IsString,
  Length,
} from 'class-validator';

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
  @IsString()
  @Length(1, 500)
  reply: string;
}