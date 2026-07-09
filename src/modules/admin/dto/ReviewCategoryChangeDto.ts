import {
    IsEnum,
    IsOptional,
    IsString,
    ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

export enum CategoryRequestAction {
    APPROVE = 'APPROVE',
    REJECT = 'REJECT',
}

export class ReviewCategoryChangeDto {

    @ApiProperty({
        enum: CategoryRequestAction,
        example: CategoryRequestAction.APPROVE,
    })
    @IsEnum(CategoryRequestAction)
    action: CategoryRequestAction;

    @ApiProperty({
        required: false,
        example: 'Categories do not meet platform requirements',
    })
    @IsOptional()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    @ValidateIf(
        (dto: ReviewCategoryChangeDto) =>
            dto.action ===
            CategoryRequestAction.REJECT,
    )
    rejectReason?: string;
}