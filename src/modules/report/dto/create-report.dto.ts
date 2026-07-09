import {
    IsEnum,
    IsString,
    ValidateIf,
    IsUUID,
    IsNotEmpty,
    Length,
} from 'class-validator';
import { Transform } from 'class-transformer';

import {
    ApiProperty,
    ApiPropertyOptional,
} from '@nestjs/swagger';

import {
    ReportReason,
    ReportType,
} from '@prisma/client';

export class CreateReportDto {

    @ApiProperty({
        enum: ReportType,
        enumName: 'ReportType',
        example: ReportType.USER,
    })
    @IsEnum(ReportType)
    reportType: ReportType;

    @ApiProperty({
        example: '69213d76-2979-45d2-a959-1440d3979461',
    })
    @IsNotEmpty()
    @IsUUID()
    targetId: string;

    @ApiProperty({
        enum: ReportReason,
        enumName: 'ReportReason',
        example: ReportReason.SPAM,
    })
    @IsEnum(ReportReason)
    reason: ReportReason;

    @ApiPropertyOptional({
        example: 'This review contains misleading information',
    })
    @ValidateIf(
        (dto) =>
            dto.reason === ReportReason.OTHER,
    )
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    @IsNotEmpty()
    @Length(5, 500)
    customReason?: string;
}