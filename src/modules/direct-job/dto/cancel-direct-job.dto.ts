import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CancelDirectJobDto {
  @ApiPropertyOptional({
    description: 'Reason for cancelling the direct job',
    example: 'Customer requested cancellation due to scheduling conflict',
  })
  @IsOptional()
  @IsString()
  @Length(2, 500)
  reason?: string;
}
