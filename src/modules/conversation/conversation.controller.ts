import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Req,
    ParseUUIDPipe,
} from '@nestjs/common';

import {
    ApiBearerAuth,
    ApiTags,
} from '@nestjs/swagger';

import type { Request }
    from 'express';


import { ConversationService }
    from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

@ApiTags('Conversations')
@Controller('conversations')
export class ConversationController {

    constructor(
        private readonly conversationService: ConversationService,
    ) { }

    @Post(':traderId')
    @ApiBearerAuth('access-token')
    async createConversation(

        @Req()
        req: Request,

        @Param('traderId', ParseUUIDPipe)
        traderId: string,

        @Body()
        body: CreateConversationDto,
    ) {
        return this.conversationService
            .createConversation(
                req['user'].id,
                traderId,
                body.jobId,
            );
    }
    @Get()
    @ApiBearerAuth('access-token')
    async getMyConversations(
        @Req() req: Request,
    ) {
        return this.conversationService
            .getMyConversations(
                req['user'].id,
            );
    }
}