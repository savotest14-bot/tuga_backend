import {
  IsUUID,
} from 'class-validator';

import {
  ApiProperty,
} from '@nestjs/swagger';

export class TraderRegisterStep3Dto {

  @ApiProperty({
    example:
      'subscription-plan-id',
  })
  @IsUUID()
  planId: string;

  @ApiProperty({
    example:
      'subscription-price-id',
  })
  @IsUUID()
  priceId: string;
}