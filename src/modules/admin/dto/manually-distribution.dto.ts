import {
  IsArray,
  ArrayNotEmpty,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ManualDistributionDto {
  @ApiProperty({
    example: [
      '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      '4ab85f64-5717-4562-b3fc-2c963f66afa7',
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true }) // remove if IDs are not UUIDs
  traderIds: string[];
}