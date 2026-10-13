import {
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import {
  ApiProperty,
  ApiPropertyOptional,
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

  @ApiPropertyOptional({
    description: 'Stripe PaymentIntent ID (if paid via Stripe)',
    example: 'pi_3MtwBwLkdIwHu7ix28a3tqPa',
  })
  @IsOptional()
  @IsString()
  paymentIntentId?: string;
}