import {
    IsBoolean,
    IsOptional,
    IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CloseJobDto {
    @ApiProperty({
        example: true,
        description: 'Whether the work was carried out or completed',
    })
    @IsBoolean()
    isWorkCarriedOut: boolean;

    @ApiProperty({
        example: 'Trader did not show up',
        description: 'Reason for closing the job if no work was carried out',
        required: false,
    })
    @IsOptional()
    @IsString()
    cancelReason?: string;
}
