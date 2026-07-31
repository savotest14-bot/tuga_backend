import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ChangePlanDto {
  @ApiProperty({
    description: 'The ID of the target subscription plan to switch to',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
  })
  @IsNotEmpty({ message: 'planId is required' })
  @IsString({ message: 'planId must be a string' })
  @IsUUID('all', { message: 'planId must be a valid UUID' })
  planId: string;
}
