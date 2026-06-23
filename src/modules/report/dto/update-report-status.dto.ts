import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum ReportAction {
    REVIEWED = 'REVIEWED',
    RESOLVED = 'RESOLVED',
    REJECTED = 'REJECTED',
}

export class UpdateReportStatusDto {

    @ApiProperty({
        enum: ReportAction,
        example: ReportAction.RESOLVED,
    })
    @IsEnum(ReportAction)
    status: ReportAction;
}