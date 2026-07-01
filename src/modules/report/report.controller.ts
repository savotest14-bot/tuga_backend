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

import type { Request } from 'express';

import {
    ApiBearerAuth,
    ApiBody,
    ApiTags,
} from '@nestjs/swagger';

import { ReportService } from './report.service';

import { CreateReportDto } from './dto/create-report.dto';
import { GetReportsDto } from './dto/get-reports.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { GetMyReportsDto } from './dto/get-my-reports.dto';

@ApiTags('Report')
@Controller('report')
export class ReportController {

    constructor(
        private readonly reportService: ReportService,
    ) { }

    // CUSTOMER

    @Post()
    @ApiBearerAuth('access-token')
    @ApiBody({
        type: CreateReportDto,
    })
    async createReport(
        @Req() req: Request,
        @Body() dto: CreateReportDto,
    ) {
        return this.reportService.createReport(
            req['user'].id,
            dto,
        );
    }

    @Get('my')
    @ApiBearerAuth('access-token')
    async getMyReports(
        @Req() req: Request,

        @Query()
        query: GetMyReportsDto,
    ) {

        return this.reportService.getMyReports(
            req['user'].id,
            query,
        );
    }

    @Get('my/:id')
    @ApiBearerAuth('access-token')
    async getMyReportDetails(
        @Req() req: Request,

        @Param('id')
        reportId: string,
    ) {

        return this.reportService.getMyReportDetails(
            req['user'].id,
            reportId,
        );
    }

    // ADMIN

    @Get('admin')
    @ApiBearerAuth('access-token')
    async getReports(
        @Query()
        query: GetReportsDto,
    ) {

        return this.reportService.getReports(
            query,
        );
    }

    @Get('admin/:id')
    @ApiBearerAuth('access-token')
    async getReportById(
        @Req() req: Request,
        @Param('id')
        reportId: string,
    ) {
        return this.reportService.getReportById(
            reportId,
            req['user'].id,
        );
    }

    @Patch('admin/:id/status')
    @ApiBearerAuth('access-token')
    async updateStatus(
        @Req() req: Request,

        @Param('id')
        reportId: string,

        @Body()
        dto: UpdateReportStatusDto,
    ) {

        return this.reportService.updateStatus(
            req['user'].id,
            reportId,
            dto,
        );
    }

}