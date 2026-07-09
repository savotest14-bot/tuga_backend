import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length, MaxLength, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactSubject } from '@prisma/client';
import { Type, Transform } from 'class-transformer';

export class CreateContactDto {
    @ApiProperty({ example: 'John Doe' })
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    @IsNotEmpty()
    @Length(2, 100)
    name: string;

    @ApiProperty({ example: 'john@example.com' })
    @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
    @IsEmail()
    @IsNotEmpty()
    @MaxLength(255)
    email: string;

    @ApiProperty({ enum: ContactSubject })
    @IsEnum(ContactSubject)
    subject: ContactSubject;

    @ApiProperty({ example: 'I have an issue with my recent order...' })
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    @IsNotEmpty()
    @Length(10, 2000)
    message: string;

    @ApiPropertyOptional({ example: false })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isAnonymous?: boolean;
}