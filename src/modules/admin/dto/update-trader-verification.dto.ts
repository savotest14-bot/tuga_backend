import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

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

  @IsString()
  rejectReason?: string;
}