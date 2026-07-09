import {
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Param,
    Body,
    Query,
    ParseUUIDPipe,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { GetFaqQueryDto } from './dto/get-faq-query.dto';
import { PublicFaqQueryDto } from './dto/public-faq-query.dto';

@ApiTags('FAQ')

@Controller('faq')
export class FaqController {
    constructor(
        private readonly faqService: FaqService,
    ) { }

    @Post()
    @ApiBearerAuth('access-token')
    create(
        @Body() body: CreateFaqDto,
    ) {
        return this.faqService.create(body);
    }

    @Get()
    @ApiBearerAuth('access-token')
    findAll(
        @Query() query: GetFaqQueryDto,
    ) {
        return this.faqService.findAll(
            query.page ?? 1,
            query.limit ?? 10,
            query.audience,
            query.isActive !== undefined ? String(query.isActive) : undefined,
        );
    }

    @Get('public')
    publicFaqs(
        @Query() query: PublicFaqQueryDto,
    ) {
        return this.faqService.publicFaqs(
            query.audience,
        );
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    findOne(
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.faqService.findOne(id);
    }

    @Put(':id')
    @ApiBearerAuth('access-token')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: UpdateFaqDto,
    ) {
        return this.faqService.update(
            id,
            body,
        );
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    remove(
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.faqService.remove(id);
    }
}