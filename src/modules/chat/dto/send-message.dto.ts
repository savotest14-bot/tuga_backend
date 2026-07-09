import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'The ID of the conversation',
    example: '69213d76-2979-45d2-a959-1440d3979461',
  })
  @IsNotEmpty()
  @IsUUID()
  conversationId: string;

  @ApiPropertyOptional({
    description: 'The text message content',
    example: 'Hello there!',
  })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  message?: string;
}
