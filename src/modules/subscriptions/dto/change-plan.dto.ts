import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { BillingCycle } from '@prisma/client';

export class ChangePlanDto {
  @ApiProperty({
    description: 'The ID of the target subscription plan to switch to',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
  })
  @IsNotEmpty({ message: 'planId is required' })
  @IsString({ message: 'planId must be a string' })
  @IsUUID('all', { message: 'planId must be a valid UUID' })
  planId: string;

  @ApiPropertyOptional({
    description: 'Target billing cycle (MONTHLY or YEARLY)',
    enum: BillingCycle,
    example: BillingCycle.MONTHLY,
  })
  @IsOptional()
  @IsEnum(BillingCycle, { message: 'billingCycle must be MONTHLY or YEARLY' })
  billingCycle?: BillingCycle;
}
