import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UploadedFiles,
    UseInterceptors,
} from '@nestjs/common';

import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiTags,
} from '@nestjs/swagger';

import type { Request } from 'express';

import { FileFieldsInterceptor } from '@nestjs/platform-express';

import { CreateJobDto } from './dto/create-job.dto';
import { JobService } from './job.service';

import { multerOptions } from 'src/common/helpers/multer.helper';
import { UpdateJobDto } from './dto/update-job.dto';
import { BudgetRange, JobTimescale } from '@prisma/client';
import { GetMyJobsDto } from './dto/get-my-job.dto';
import { GetMatchedJobsDto } from './dto/get-match-job.dto';
import { IncreaseRadiusDto } from './dto/increase-radius.dto';

@ApiTags('Jobs')
@Controller('jobs')
export class JobController {

    constructor(
        private readonly jobService: JobService,
    ) { }

    @ApiBody({
        schema: {
            type: 'object',

            properties: {

                categoryId: {
                    type: 'string',
                },

                skillServiceId: {
                    type: 'string',
                },

                subCategoryId: {
                    type: 'string',
                    nullable: true,
                },

                postcode: {
                    type: 'string',
                    nullable: true,
                },

                latitude: {
                    type: 'number',
                    example: 23.2599,
                    nullable: true,
                },

                longitude: {
                    type: 'number',
                    example: 77.4126,
                    nullable: true,
                },

                title: {
                    type: 'string',
                },

                description: {
                    type: 'string',
                },

                timescale: {
                    type: 'string',
                    enum: [
                        "URGENT",
                        "WITHIN_3_DAYS",
                        "WITHIN_1_WEEK",
                        "WITHIN_1_MONTH",
                        "FLEXIBLE"
                    ],
                },

                emergency: {
                    type: 'boolean',
                    example: false,
                },

                budgetRange: {
                    type: 'string',
                    enum: [
                        'UNDER_100',
                        'UNDER_250',
                        'UNDER_500',
                        'UNDER_1000',
                        'UNDER_2000',
                        'UNDER_4000',
                        'UNDER_8000',
                        'BETWEEN_10000_20000',
                        'BETWEEN_20000_30000',
                        'ABOVE_30000',
                    ],
                    nullable: true,
                },

                files: {
                    type: 'array',

                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                },
            },

            required: [
                'categoryId',
                'skillServiceId',
                'title',
                'description',
                'timescale',
            ],
        },
    })
    @Post()
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                {
                    name: 'files',
                    maxCount: 10,
                },
            ],
            multerOptions('jobs'),
        ),
    )
    async createJob(
        @Req() req: Request,

        @Body() dto: CreateJobDto,

        @UploadedFiles()
        files: {
            files?: Express.Multer.File[];
        },
    ) {
        return this.jobService.createJob(
            req['user'].id,
            dto,
            files?.files || [],
        );
    }

    @Patch(':jobId')

    @ApiBearerAuth('access-token')

    @ApiConsumes('multipart/form-data')

    @ApiBody({
        schema: {
            type: 'object',

            properties: {

                categoryId: {
                    type: 'string',
                },

                skillServiceId: {
                    type: 'string',
                },

                subCategoryId: {
                    type: 'string',
                },

                postcode: {
                    type: 'string',
                },

                latitude: {
                    type: 'number',
                },

                longitude: {
                    type: 'number',
                },

                title: {
                    type: 'string',
                },

                description: {
                    type: 'string',
                },

                timescale: {
                    type: 'string',
                    enum: Object.values(JobTimescale),
                },

                emergency: {
                    type: 'boolean',
                },

                budgetRange: {
                    type: 'string',
                    enum: Object.values(BudgetRange),
                },

                replaceFiles: {
                    type: 'boolean',
                },

                files: {
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
            [
                {
                    name: 'files',
                    maxCount: 10,
                },
            ],

            multerOptions('jobs'),
        ),
    )

    async updateJob(

        @Req()
        req: Request,

        @Param('jobId')
        jobId: string,

        @Body()
        dto: UpdateJobDto,

        @UploadedFiles()
        files: {
            files?: Express.Multer.File[];
        },

    ) {

        return this.jobService.updateJob(

            req['user'].id,

            jobId,

            dto,

            files?.files || [],
        );
    }

    @Get('my-jobs')
    @ApiBearerAuth('access-token')
    async getMyJobs(
        @Req() req: Request,
        @Query() query: GetMyJobsDto,
    ) {
        return this.jobService.getMyJobs(
            req['user'].id,
            query,
        );
    }

    @Get('matched-jobs')
    @ApiBearerAuth('access-token')
    async getMatchedJobs(
        @Req() req: Request,
        @Query() query: GetMatchedJobsDto,
    ) {

        return this.jobService.getMatchedJobs(
            req['user'].id,
            query,
        );
    }

    @Patch(':jobId/start')
    @ApiBearerAuth('access-token')
    async startJob(

        @Req()
        req: Request,

        @Param('jobId')
        jobId: string,
    ) {

        return this.jobService.startJob(
            req['user'].id,
            jobId,
        );
    }


    @Patch(':jobId/complete')
    @ApiBearerAuth('access-token')
    async completeJob(

        @Req()
        req: Request,

        @Param('jobId')
        jobId: string,
    ) {

        return this.jobService.completeJob(
            req['user'].id,
            jobId,
        );
    }


    @Patch(':jobId/cancel')
    @ApiBearerAuth('access-token')
    async cancelJob(

        @Req()
        req: Request,

        @Param('jobId')
        jobId: string,
    ) {

        return this.jobService.cancelJob(
            req['user'].id,
            jobId,
        );
    }


    @Post('admin/:id/pause')
    @ApiBearerAuth('access-token')
    async pauseJob(
        @Req() req: Request,
        @Param('id') id: string,
    ) {
        return this.jobService.pauseDistribution(
            req['user'].id,
            id,
        );
    }

    @Post('admin/:id/resume')
    @ApiBearerAuth('access-token')
    async resumeJob(
        @Req() req: Request,
        @Param('id') id: string,
    ) {
        return this.jobService.resumeDistribution(
            req['user'].id,
            id,
        );
    }

    @Post('admin/:id/restart-auto')
    @ApiBearerAuth('access-token')
    async restartAuto(
        @Req() req: Request,
        @Param('id') id: string,
    ) {
        return this.jobService.restartAutoDistribution(
            req['user'].id,
            id,
        );
    }

    @Post('admin/:id/increase-radius')
    @ApiBearerAuth('access-token')
    async increaseRadius(
        @Req() req: Request,
        @Param('id') id: string,
        @Body() dto: IncreaseRadiusDto,
    ) {
        return this.jobService.increaseRadius(
            req['user'].id,
            id,
            dto.radiusKm,
        );
    }

    @Post('admin/:id/close')
    @ApiBearerAuth('access-token')
    async closeJob(
        @Req() req: Request,
        @Param('id') id: string,
    ) {
        return this.jobService.closeDistribution(
            req['user'].id,
            id,
        );
    }

}