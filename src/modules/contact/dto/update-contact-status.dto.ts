import { IsEnum } from 'class-validator';
import { ContactStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateContactStatusDto {
  @ApiProperty({ enum: ContactStatus })
  @IsEnum(ContactStatus)
  status: ContactStatus;
}
