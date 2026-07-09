import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FaqAudience } from '@prisma/client';

export class PublicFaqQueryDto {
  @ApiPropertyOptional({ enum: FaqAudience })
  @IsOptional()
  @IsEnum(FaqAudience)
  audience?: FaqAudience;
}
