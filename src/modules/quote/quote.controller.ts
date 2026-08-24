import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Req,
    ParseUUIDPipe,
    UploadedFiles,
    UseInterceptors,
    Patch,
} from '@nestjs/common';

import {
    ApiBearerAuth,
    ApiTags,
} from '@nestjs/swagger';
import {
    ApiConsumes,
    ApiBody,
} from '@nestjs/swagger';

import type { Request } from 'express';

import { CreateQuoteDto } from './dto/create-quote.dto';

import { QuoteService } from './quote.service';
import { GetMyQuotesDto } from './dto/get-my-quote.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/common/helpers/multer.helper';

@ApiTags('Quotes')
@Controller('quotes')
export class QuoteController {

    constructor(
        private readonly quoteService: QuoteService,
    ) { }

    /*
    |--------------------------------------------------------------------------
    | CREATE QUOTE
    |--------------------------------------------------------------------------
    */

    @Post(':jobId')
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                price: { type: 'number', nullable: true },
                estimatedDays: { type: 'number', nullable: true },
                message: { type: 'string', nullable: true },
                attachments: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                },
            },
        },
    })
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                {
                    name: 'attachments',
                    maxCount: 10,
                },
            ],
            multerOptions('quotes'),
        ),
    )
    async createQuote(
        @Req() req: Request,

        @Param('jobId', ParseUUIDPipe)
        jobId: string,

        @Body()
        dto: CreateQuoteDto,

        @UploadedFiles()
        files: { attachments?: Express.Multer.File[] },
    ) {

        return this.quoteService.createQuote(
            req['user'].id,
            jobId,
            dto,
            files?.attachments || [],
        );
    }

    /*
    |--------------------------------------------------------------------------
    | ACCEPT QUOTE
    |--------------------------------------------------------------------------
    */

    @Post('accept/:quoteId')
    @ApiBearerAuth('access-token')
    async acceptQuote(
        @Req() req: Request,

        @Param('quoteId', ParseUUIDPipe)
        quoteId: string,
    ) {

        return this.quoteService.acceptQuote(
            req['user'].id,
            quoteId,
        );
    }

    /*
    |--------------------------------------------------------------------------
    | REJECT QUOTE
    |--------------------------------------------------------------------------
    */

    @Post('reject/:quoteId')
    @ApiBearerAuth('access-token')
    async rejectQuote(
        @Req() req: Request,

        @Param('quoteId', ParseUUIDPipe)
        quoteId: string,
    ) {

        return this.quoteService.rejectQuote(
            req['user'].id,
            quoteId,
        );
    }


    @Get('job/:jobId')
    @ApiBearerAuth('access-token')
    async getJobQuotes(
        @Req() req: Request,

        @Param('jobId', ParseUUIDPipe)
        jobId: string,
    ) {

        return this.quoteService.getJobQuotes(
            req['user'].id,
            jobId,
        );
    }

    @Get('my-quotes')
    @ApiBearerAuth('access-token')
    async getMyQuotes(
        @Req() req: Request,
        @Query() query: GetMyQuotesDto,
    ) {
        return this.quoteService.getMyQuotes(
            req['user'].id,
            query,
        );
    }

    @Get('my-quote/:jobId')
    @ApiBearerAuth('access-token')
    async getMyQuoteByJob(
        @Req() req: Request,

        @Param('jobId', ParseUUIDPipe)
        jobId: string,
    ) {

        return this.quoteService.getMyQuoteByJob(
            req['user'].id,
            jobId,
        );
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE QUOTE
    |--------------------------------------------------------------------------
    */

    @Patch(':quoteId')
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                price: { type: 'number', nullable: true },
                estimatedDays: { type: 'number', nullable: true },
                message: { type: 'string', nullable: true },
                attachments: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                },
            },
        },
    })
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                {
                    name: 'attachments',
                    maxCount: 10,
                },
            ],
            multerOptions('quotes'),
        ),
    )
    async updateQuote(
        @Req() req: Request,

        @Param('quoteId', ParseUUIDPipe)
        quoteId: string,

        @Body()
        dto: CreateQuoteDto,

        @UploadedFiles()
        files: { attachments?: Express.Multer.File[] },
    ) {
        return this.quoteService.updateQuote(
            req['user'].id,
            quoteId,
            dto,
            files?.attachments || [],
        );
    }
}