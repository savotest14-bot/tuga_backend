import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Req,
    ParseUUIDPipe,
} from '@nestjs/common';

import {
    ApiBearerAuth,
    ApiTags,
} from '@nestjs/swagger';

import type { Request } from 'express';

import { CreateQuoteDto } from './dto/create-quote.dto';

import { QuoteService } from './quote.service';
import { GetMyQuotesDto } from './dto/get-my-quote.dto';

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
    async createQuote(
        @Req() req: Request,

        @Param('jobId', ParseUUIDPipe)
        jobId: string,

        @Body()
        dto: CreateQuoteDto,
    ) {

        return this.quoteService.createQuote(
            req['user'].id,
            jobId,
            dto,
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
}