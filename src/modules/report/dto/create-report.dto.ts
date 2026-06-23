import {
    IsEnum,
    IsString,
    ValidateIf,
} from 'class-validator';

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
        example: 'review-id',
    })
    @IsString()
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
    @IsString()
    customReason?: string;
}