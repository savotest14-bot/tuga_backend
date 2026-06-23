import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactSubject } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateContactDto {
    @ApiProperty({ example: 'John Doe' })
    @IsString()
    @IsNotEmpty()
    @Length(2, 100)
    name: string;

    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ enum: ContactSubject })
    @IsEnum(ContactSubject)
    subject: ContactSubject;

    @ApiProperty({ example: 'I have an issue with my recent order...' })
    @IsString()
    @IsNotEmpty()
    @Length(10, 2000)
    message: string;

    @ApiPropertyOptional({ example: false })
    @IsOptional()
    @Type(() => Boolean)
    isAnonymous?: boolean;
}