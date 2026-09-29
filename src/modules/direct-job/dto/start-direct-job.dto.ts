import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

export class StartDirectJobDto {
  @ApiProperty({
    description: 'Conversation ID for the direct chat',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  conversationId: string;

  @ApiPropertyOptional({
    description: 'Optional job title or service summary',
    example: 'Kitchen Cabinet Repair',
  })
  @IsOptional()
  @IsString()
  @Length(2, 150)
  title?: string;

  @ApiPropertyOptional({
    description: 'Optional description of work agreed in chat',
    example: 'Fix hinges and realign 4 cabinet doors in the kitchen',
  })
  @IsOptional()
  @IsString()
  @Length(2, 2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Optional agreed price in EUR',
    example: 120.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  agreedPrice?: number;
}
