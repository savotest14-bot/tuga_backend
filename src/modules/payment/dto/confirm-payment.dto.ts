import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ConfirmPaymentDto {
  @ApiProperty({
    description: 'Stripe PaymentIntent ID (e.g. pi_3MtwBwLkdIwHu7ix28a3tqPa)',
    example: 'pi_3MtwBwLkdIwHu7ix28a3tqPa',
  })
  @IsNotEmpty()
  @IsString()
  paymentIntentId: string;

  @ApiPropertyOptional({
    description: 'Subscription Plan ID associated with this payment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiPropertyOptional({
    description: 'Subscription Price ID associated with this payment',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  priceId?: string;
}
