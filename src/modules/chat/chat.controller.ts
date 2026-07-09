
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
  ParseUUIDPipe,
} from '@nestjs/common';

import {
  FilesInterceptor,
} from '@nestjs/platform-express';

import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import type { Request }
from 'express';

import { multerOptions }
from 'src/common/helpers/multer.helper';

import { ChatService }
from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Chat')
@ApiBearerAuth('access-token')
@Controller('chat')
export class ChatController {

  constructor(
    private readonly chatService: ChatService,
  ) {}

  /*
  |--------------------------------------------------------------------------
  | SEND MESSAGE
  |--------------------------------------------------------------------------
  */

  @Post('send-message')

  @ApiOperation({
    summary:
      'Send message with multiple attachments',
  })

  @ApiConsumes(
    'multipart/form-data',
  )

  @ApiBody({
    schema: {
      type: 'object',

      properties: {

        conversationId: {
          type: 'string',
        },

        message: {
          type: 'string',
        },

        attachments: {
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
    FilesInterceptor(
      'attachments',
      10,
      multerOptions('chat'),
    ),
  )

  async sendMessage(

    @Req()
    req: Request,

    @Body()
    body: SendMessageDto,

    @UploadedFiles()
    files?: Express.Multer.File[],
  ) {

    /*
    |--------------------------------------------------------------------------
    | ATTACHMENTS
    |--------------------------------------------------------------------------
    */

    let attachments: string[] = [];

    if (
      files &&
      files.length > 0
    ) {

      attachments =
        files.map(
          (file) =>
            file.path.replace(
              /\\/g,
              '/',
            ),
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SAVE MESSAGE
    |--------------------------------------------------------------------------
    */

    const message =
      await this.chatService
        .sendMessage({

          conversationId:
            body.conversationId,

          senderId:
            req['user'].id,

          message:
            body.message,

          attachments,
        });

    return {
      success: true,
      data: message,
    };
  }
  /*
  |--------------------------------------------------------------------------
  | GET MESSAGES
  |--------------------------------------------------------------------------
  */
  @Get(
    ':conversationId/messages',
  )
  async getMessages(

    @Req()
    req: Request,

    @Param('conversationId', ParseUUIDPipe)
    conversationId: string,
  ) {
    const messages =
      await this.chatService
        .getConversationMessages(
          conversationId,
          req['user'].id,
        );

    return {
      success: true,
      data: messages,
    };
  }

}

