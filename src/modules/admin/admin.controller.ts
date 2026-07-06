// admin.controller.ts

import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
} from '@nestjs/common';

import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';

import {
    AdminService,
} from './admin.service';
import { UpdateTraderVerificationDto } from './dto/update-trader-verification.dto';
import { ReviewCategoryChangeDto } from './dto/ReviewCategoryChangeDto';
import { GetJobsDto } from './dto/get-job.dto';
import { GetManualReviewJobsDto } from './dto/get-manual-review-job.dto';
import { ManualDistributionDto } from './dto/manually-distribution.dto';
import { SuggestedTradersDto } from './dto/get-suggested-trader.dto';
import { GetReviewsDto } from './dto/get-review.dto';
import { GetAllQuotesDto } from './dto/get-all-quote.dto';

@ApiTags('Admin')

@ApiBearerAuth('access-token')
@Controller('admin')
export class AdminController {

    constructor(
        private readonly adminService: AdminService,
    ) { }

    // =========================
    // CUSTOMERS
    // =========================

    @Get('customers')

    @ApiQuery({
        name: 'page',
        required: false,
        example: 1,
    })

    @ApiQuery({
        name: 'limit',
        required: false,
        example: 10,
    })

    @ApiQuery({
        name: 'status',
        required: false, // OPTIONAL
        enum: [
            'ACTIVE',
            'INACTIVE',
            'BLOCKED',
            'PENDING',
        ],
    })

    @ApiQuery({
        name: 'search',
        required: false, // OPTIONAL
        example: 'john',
    })

    async getCustomers(

        @Query('page')
        page: number = 1,

        @Query('limit')
        limit: number = 10,

        @Query('status')
        status?: string,

        @Query('search')
        search?: string,
    ) {

        return this.adminService.getCustomers(

            Number(page),

            Number(limit),

            status,

            search,
        );
    }

    // =========================
    // TRADERS
    // =========================

    @Get('traders')

    @ApiQuery({
        name: 'page',
        required: false,
        example: 1,
    })

    @ApiQuery({
        name: 'limit',
        required: false,
        example: 10,
    })

    @ApiQuery({
        name: 'status',
        required: false, // OPTIONAL
        enum: [
            'ACTIVE',
            'INACTIVE',
            'BLOCKED',
            'PENDING',
        ],
    })

    @ApiQuery({
        name: 'search',
        required: false, // OPTIONAL
        example: 'amit',
    })

    async getTraders(

        @Query('page')
        page: number = 1,

        @Query('limit')
        limit: number = 10,

        @Query('status')
        status?: string,

        @Query('search')
        search?: string,
    ) {

        return this.adminService.getTraders(

            Number(page),

            Number(limit),

            status,

            search,
        );
    }

    @Patch(
        'verify-trader/:id',
    )
    @ApiBearerAuth('access-token')
    async verifyTrader(

        @Param('id')
        id: string,

        @Body()
        body: UpdateTraderVerificationDto,
    ) {

        return this.adminService.verifyTrader(
            id,
            body,
        );
    }
    @Post(':reviewId/approve')
    @ApiBearerAuth('access-token')
    async approveReview(
        @Req() req: Request,
        @Param('reviewId') reviewId: string,
    ) {
        return this.adminService.approveReview(
            reviewId,
            req['user'].id,
        );
    }

    @Get('pending/reviews')

    @ApiBearerAuth('access-token')

    @ApiOperation({
        summary:
            'Get pending reviews for approval',
    })

    @ApiQuery({
        name: 'page',
        required: false,
        example: 1,
    })

    @ApiQuery({
        name: 'limit',
        required: false,
        example: 10,
    })

    async getPendingReviews(

        @Query('page')
        page: number = 1,

        @Query('limit')
        limit: number = 10,

    ) {

        return this.adminService.getPendingReviews(
            Number(page),
            Number(limit),
        );
    }

    @Post('category-requests/:requestId/review')
    @ApiBearerAuth('access-token')
    async reviewCategoryRequest(
        @Param('requestId')
        requestId: string,

        @Body()
        dto: ReviewCategoryChangeDto,

        @Req()
        req: any,
    ) {
        return this.adminService.reviewCategoryChangeRequest(
            requestId,
            req.user.id,
            dto,
        );
    }

    @Get('category-requests')
    @ApiBearerAuth('access-token')
    @ApiQuery({
        name: 'page',
        required: false,
        type: Number,
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
    })
    @ApiQuery({
        name: 'status',
        required: false,
        enum: [
            'PENDING',
            'APPROVED',
            'REJECTED',
        ],
    })
    async getCategoryChangeRequests(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('status') status?: string,
    ) {
        return this.adminService.getCategoryChangeRequests(
            page,
            limit,
            status,
        );
    }

    @Get('users/:userId')
    @ApiBearerAuth('access-token')
    async getUserDetails(
        @Param('userId') userId: string,
    ) {
        return this.adminService.getUserDetails(
            userId,
        );
    }

    @Get('jobs')
    @ApiBearerAuth('access-token')
    async getAllJobs(
        @Query() query: GetJobsDto,
    ) {
        return this.adminService.getAllJobs(
            query,
        );
    }

    @Get('jobs/:id')
    @ApiBearerAuth('access-token')
    async getJobDetails(@Param('id') id: string) {
        return this.adminService.getJobDetails(id);
    }

    @Get('reviews')
    @ApiBearerAuth('access-token')
    async getAllReviews(
        @Query() query: GetReviewsDto,
    ) {
        return this.adminService.getAllReviews(query);
    }

    @Get('job/manual-review')
    @ApiBearerAuth('access-token')
    async getManualReviewJobs(
        @Query() query: GetManualReviewJobsDto,
    ) {
        return this.adminService.getManualReviewJobs(
            query,
        );
    }

    @Post(':jobId/distribute')
    @ApiBearerAuth('access-token')
    async distributeManually(
        @Req() req: Request,
        @Param('jobId') jobId: string,
        @Body() dto: ManualDistributionDto,
    ) {
        return this.adminService.distributeManually(
            req['user'].id,
            jobId,
            dto.traderIds,
        );
    }

    @Get('jobs/:jobId/suggested-traders')
    @ApiBearerAuth('access-token')
    @ApiParam({
        name: 'jobId',
        type: String,
        example: '4d0840bb-4aff-4a20-a2a4-253f48e722d2',
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
    })
    @ApiQuery({
        name: 'radius',
        required: false,
        type: Number,
    })
    async getSuggestedTraders(
        @Param('jobId') jobId: string,
        @Query() query: SuggestedTradersDto,
    ) {
        console.log('SUGGESTED TRADERS HIT');

        return this.adminService.getSuggestedTraders(
            jobId,
            query.limit,
            query.radius,
        );
    }

    @Get('quotes')
    @ApiBearerAuth('access-token')
    async getAllQuotes(
        @Query() query: GetAllQuotesDto,
    ) {
        return this.adminService.getAllQuotes(query);
    }

    @Get('job-action-logs')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get all admin job action logs' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'jobId', required: false, type: String })
    @ApiQuery({ name: 'action', required: false, type: String })
    async getAdminJobActionLogs(
        @Query('page') page = '1',
        @Query('limit') limit = '10',
        @Query('jobId') jobId?: string,
        @Query('action') action?: string,
    ) {
        return this.adminService.getAdminJobActionLogs({
            page: Number(page),
            limit: Number(limit),
            jobId,
            action,
        });
    }
}