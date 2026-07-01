import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    Req,
    UploadedFiles,
    UseInterceptors,
} from '@nestjs/common';

import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';

import type { Request } from 'express';

import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';
import { multerOptions } from 'src/common/helpers/multer.helper';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ReviewInteractionSource, ReviewType } from '@prisma/client';

import { NoWorkReason } from '@prisma/client';
import { GetMyReviewsDto } from './dto/get-my-review.dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
    constructor(
        private readonly reviewService: ReviewService,
    ) { }

    /*
    |--------------------------------------------------------------------------
    | CREATE REVIEW
    |--------------------------------------------------------------------------
    */

    @Post()

    @ApiBearerAuth('access-token')

    @ApiConsumes('multipart/form-data')

    @ApiBody({
        schema: {
            type: 'object',

            properties: {

                traderId: {
                    type: 'string',
                    format: 'uuid',
                },

                jobId: {
                    type: 'string',
                    format: 'uuid',
                    nullable: true,
                },

                reviewType: {
                    type: 'string',
                    enum: Object.values(ReviewType),
                },

                interactionSource: {
                    type: 'string',
                    enum: Object.values(
                        ReviewInteractionSource,
                    ),
                    nullable: true,
                },

                workCompletedDate: {
                    type: 'string',
                    format: 'date',
                },

                wouldRecommendTrader: {
                    type: 'boolean',
                },

                noWorkReason: {
                    type: 'string',
                    enum: Object.values(NoWorkReason),
                },

                noWorkReasonText: {
                    type: 'string',
                    maxLength: 500,
                },

                rating: {
                    type: 'number',
                    minimum: 1,
                    maximum: 5,
                },

                title: {
                    type: 'string',
                    maxLength: 120,
                },

                review: {
                    type: 'string',
                    maxLength: 1000,
                },

                wasWorkCompleted: {
                    type: 'boolean',
                },

                proofs: {
                    type: 'array',

                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                },
            },

            required: [
                'traderId',
                'reviewType',
                'rating',
                'wasWorkCompleted',
            ],
        },
    })

    @UseInterceptors(
        FileFieldsInterceptor(
            [
                {
                    name: 'proofs',
                    maxCount: 10,
                },
            ],

            multerOptions('reviews'),
        ),
    )

    async createReview(

        @Req()
        req: Request,

        @Body()
        dto: CreateReviewDto,

        @UploadedFiles()
        files: {
            proofs?: Express.Multer.File[];
        },

    ) {

        return this.reviewService.createReview(

            req['user'].id,

            dto,

            files?.proofs || [],
        );
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE REVIEW
    |--------------------------------------------------------------------------
    */

    @Put(':reviewId')
    @ApiBearerAuth('access-token')
    @ApiParam({
        name: 'reviewId',
        example: 'uuid',
    })
    @ApiConsumes('multipart/form-data')   // ← Important for Swagger
    @ApiBody({
        description: 'Update review with optional proofs',
        schema: {
            type: 'object',
            properties: {
                rating: { type: 'number', minimum: 1, maximum: 5 },
                title: { type: 'string', maxLength: 120 },
                review: { type: 'string', maxLength: 1000 },
                wasWorkCompleted: { type: 'boolean' },
                workCompletedDate: { type: 'string', format: 'date' },
                wouldRecommendTrader: { type: 'boolean' },
                noWorkReason: { enum: Object.values(NoWorkReason) },
                noWorkReasonText: { type: 'string' },
                replaceProofs: { type: 'boolean', default: false },
                proofs: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                },
            },
        },
    })
    @UseInterceptors(
        FileFieldsInterceptor(
            [{ name: 'proofs', maxCount: 10 }],
            multerOptions('reviews'),
        ),
    )
    async updateReview(
        @Req() req: Request,
        @Param('reviewId') reviewId: string,
        @Body() dto: UpdateReviewDto,
        @UploadedFiles() files: { proofs?: Express.Multer.File[] },
    ) {
        return this.reviewService.updateReview(
            req['user'].id,
            reviewId,
            dto,
            files?.proofs || [],
        );
    }



    /*
    |--------------------------------------------------------------------------
    | GET TRADER REVIEWS
    |--------------------------------------------------------------------------
    */

    @Get('trader/:traderId')
    @ApiBearerAuth('access-token')
    @ApiParam({ name: 'traderId' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async getTraderReviews(
        @Param('traderId') traderId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.reviewService.getTraderReviews(
            traderId,
            Number(page || 1),
            Number(limit || 10),
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TRADER SUMMARY
    |--------------------------------------------------------------------------
    */

    @Get('trader/:traderId/summary')
    @ApiBearerAuth('access-token')
    async getTraderRatingSummary(
        @Param('traderId') traderId: string,
    ) {
        return this.reviewService.getTraderRatingSummary(
            traderId,
        );
    }

    /*
    |--------------------------------------------------------------------------
    | MY REVIEWS
    |--------------------------------------------------------------------------
    */

    @Get('my-reviews')
    @ApiBearerAuth('access-token')
    async getMyReviews(
        @Req() req: Request,
        @Query() query: GetMyReviewsDto,
    ) {
        return this.reviewService.getMyReviews(
            req['user'].id,
            query,
        );
    }

    @Get('own/my-reviews')
    @ApiBearerAuth('access-token')
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async getTraderOwnReviews(
        @Req() req: Request,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.reviewService.getTraderReviews(
            req['user'].id,
            Number(page || 1),
            Number(limit || 10),
        );
    }
    /*
    |--------------------------------------------------------------------------
    | DELETE REVIEW
    |--------------------------------------------------------------------------
    */

    @Delete(':reviewId')
    @ApiBearerAuth('access-token')
    async deleteReview(
        @Req() req: Request,
        @Param('reviewId') reviewId: string,
    ) {
        return this.reviewService.deleteReview(
            req['user'].id,
            reviewId,
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TRADER REPLY
    |--------------------------------------------------------------------------
    */

    @Post(':reviewId/reply')
    @ApiBearerAuth('access-token')
    async replyToReview(
        @Req() req: Request,
        @Param('reviewId') reviewId: string,
        @Body() dto: ReplyReviewDto,
    ) {
        return this.reviewService.replyToReview(
            req['user'].id,
            reviewId,
            dto.reply,
        );
    }

    @Get(':reviewId')

    @ApiBearerAuth('access-token')

    @ApiOperation({
        summary:
            'Get review by id',
    })


    async getReviewById(

        @Req()
        req: Request,

        @Param('reviewId')
        reviewId: string,

    ) {

        return this.reviewService.getReviewById(

            req['user'].id,

            reviewId,
        );
    }

}