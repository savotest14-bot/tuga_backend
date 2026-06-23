import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContactStatus } from '@prisma/client';

export class GetContactsQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    page?: number = 1;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    limit?: number = 20;

    @ApiPropertyOptional({
        enum: ContactStatus,
    })
    @IsOptional()
    @IsEnum(ContactStatus)
    status?: ContactStatus;

    @ApiPropertyOptional()
    @IsOptional()
    search?: string;
}