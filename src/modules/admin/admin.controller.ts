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
    ParseUUIDPipe,
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
import { GetCustomersQueryDto } from './dto/get-customers-query.dto';
import { GetTradersQueryDto } from './dto/get-traders-query.dto';
import { GetPendingReviewsQueryDto } from './dto/get-pending-reviews-query.dto';
import { GetCategoryChangeRequestsQueryDto } from './dto/get-category-change-requests-query.dto';
import { GetAdminJobActionLogsQueryDto } from './dto/get-admin-job-action-logs-query.dto';

import type { Request } from 'express';

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
        @Query() query: GetCustomersQueryDto,
    ) {

        return this.adminService.getCustomers(
            query.page ?? 1,
            query.limit ?? 10,
            query.status,
            query.search,
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
        @Query() query: GetTradersQueryDto,
    ) {

        return this.adminService.getTraders(
            query.page ?? 1,
            query.limit ?? 10,
            query.status,
            query.search,
        );
    }

    @Patch(
        'verify-trader/:id',
    )
    @ApiBearerAuth('access-token')
    async verifyTrader(

        @Param('id', ParseUUIDPipe)
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
        @Param('reviewId', ParseUUIDPipe) reviewId: string,
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
        @Query() query: GetPendingReviewsQueryDto,
    ) {

        return this.adminService.getPendingReviews(
            query.page ?? 1,
            query.limit ?? 10,
        );
    }

    @Post('category-requests/:requestId/review')
    @ApiBearerAuth('access-token')
    async reviewCategoryRequest(
        @Param('requestId', ParseUUIDPipe)
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
        @Query() query: GetCategoryChangeRequestsQueryDto,
    ) {
        return this.adminService.getCategoryChangeRequests(
            query.page ?? 1,
            query.limit ?? 10,
            query.status,
        );
    }

    @Get('users/:userId')
    @ApiBearerAuth('access-token')
    async getUserDetails(
        @Param('userId', ParseUUIDPipe) userId: string,
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
    async getJobDetails(@Param('id', ParseUUIDPipe) id: string) {
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
        @Param('jobId', ParseUUIDPipe) jobId: string,
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
        @Param('jobId', ParseUUIDPipe) jobId: string,
        @Query() query: SuggestedTradersDto,
    ) {
        console.log('SUGGESTED TRADERS HIT');

        return this.adminService.getSuggestedTraders(
            jobId,
            query.limit ?? 50,
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
        @Query() query: GetAdminJobActionLogsQueryDto,
    ) {
        return this.adminService.getAdminJobActionLogs({
            page: query.page,
            limit: query.limit,
            jobId: query.jobId,
            action: query.action,
        });
    }
}