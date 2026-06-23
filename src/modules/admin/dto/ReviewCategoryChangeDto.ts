import {
    IsEnum,
    IsOptional,
    IsString,
    ValidateIf,
} from 'class-validator';

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
    @IsString()
    @ValidateIf(
        (dto: ReviewCategoryChangeDto) =>
            dto.action ===
            CategoryRequestAction.REJECT,
    )
    rejectReason?: string;
}