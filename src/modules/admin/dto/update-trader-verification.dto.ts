import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export enum VerificationStatus {

  APPROVED = 'APPROVED',

  REJECTED = 'REJECTED',
}

export class UpdateTraderVerificationDto {

  @ApiProperty({

    enum: VerificationStatus,

    example: 'APPROVED',

    description:
      'Trader verification status',
  })

  @IsEnum(
    VerificationStatus,
  )
  verificationStatus:
    VerificationStatus;

  @ApiPropertyOptional({

    example:
      'Invalid business documents',

    description:
      'Reason for rejection',
  })

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  rejectReason?: string;
}