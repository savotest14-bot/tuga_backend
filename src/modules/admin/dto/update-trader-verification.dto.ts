import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { VerificationStatus } from '@prisma/client';
import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';


export class UpdateTraderVerificationDto {

  @ApiProperty({

    enum: VerificationStatus,

    example: 'APPROVED',

    description:
      'Trader verification status',
  })

 @IsEnum(VerificationStatus)
verificationStatus: VerificationStatus;

 @ApiPropertyOptional({
  example: 'Please upload a clearer copy of your business license.',
  description: 'Reason for rejection or manual verification.',
})
@IsOptional()
@Transform(({ value }) =>
  typeof value === 'string' ? value.trim() : value,
)
@IsString()
rejectReason?: string;
}