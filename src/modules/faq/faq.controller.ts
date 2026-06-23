import {
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Param,
    Body,
    Query,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { FaqAudience } from '@prisma/client';

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
        @Query('page') page = 1,
        @Query('limit') limit = 10,
        @Query('audience')
        audience?: string,
        @Query('isActive')
        isActive?: string,
    ) {
        return this.faqService.findAll(
            Number(page),
            Number(limit),
            audience,
            isActive,
        );
    }

    @Get('public')
    publicFaqs(
        @Query('audience')
        audience?: FaqAudience,
    ) {
        return this.faqService.publicFaqs(
            audience,
        );
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    findOne(
        @Param('id') id: string,
    ) {
        return this.faqService.findOne(id);
    }

    @Put(':id')
    @ApiBearerAuth('access-token')
    update(
        @Param('id') id: string,
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
        @Param('id') id: string,
    ) {
        return this.faqService.remove(id);
    }
}