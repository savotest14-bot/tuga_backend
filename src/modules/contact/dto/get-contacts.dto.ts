import { Type, Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min, Max, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContactStatus } from '@prisma/client';

export class GetContactsQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @ApiPropertyOptional({
        enum: ContactStatus,
    })
    @IsOptional()
    @IsEnum(ContactStatus)
    status?: ContactStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    search?: string;
}