import {
    IsNumber,
    Min,
    Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IncreaseRadiusDto {
    @ApiProperty({
        example: 10,
        description:
            'Additional radius in kilometers',
    })
    @IsNumber()
    @Min(1)
    @Max(100)
    radiusKm: number;
}