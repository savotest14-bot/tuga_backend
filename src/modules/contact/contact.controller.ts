import {
    Controller,
    Post,
    Body,
    UseInterceptors,
    UploadedFiles,
    Req,
    Param,
    Patch,
    Get,
    Query,
    ParseUUIDPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiBody, ApiTags, ApiQuery, ApiOperation } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { ContactSubject, ContactStatus } from '@prisma/client';
import { multerOptions } from 'src/common/helpers/multer.helper';
import { GetContactsQueryDto } from './dto/get-contacts.dto';
import { UpdateContactStatusDto } from './dto/update-contact-status.dto';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
    constructor(private readonly contactService: ContactService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Submit contact form with optional attachments',
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                email: { type: 'string' },
                subject: { enum: Object.values(ContactSubject) },
                message: { type: 'string' },
                isAnonymous: { type: 'boolean' },
                attachments: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                },
            },
        },
    })
    @UseInterceptors(
        FileFieldsInterceptor(
            [{ name: 'attachments', maxCount: 5 }],
            multerOptions('contacts'),   // Adjust folder as needed
        ),
    )
    async createContact(
        @Req() req: any,
        @Body() dto: CreateContactDto,
        @UploadedFiles() files: { attachments?: Express.Multer.File[] },
    ) {
        const userId = req['user']?.id || req.user.id || null;   // null if anonymous

        return this.contactService.createContactSubmission(
            userId,
            dto,
            files?.attachments || [],
        );
    }

    @Get()
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Get all contact submissions',
    })
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
    })
    @ApiQuery({
        name: 'search',
        required: false,
    })
    async getAllContacts(
        @Req() req: any,
        @Query() query: GetContactsQueryDto,
    ) {
        console.log(
            'Fetching contacts with query:',
            query,
        );

        return this.contactService.getAllContactSubmissions(
            req.user,
            query,
        );
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    async getContactById(@Param('id', ParseUUIDPipe) id: string) {
        return this.contactService.getContactSubmissionById(id);
    }

    @Patch(':id/status')
    @ApiBearerAuth('access-token')
    @ApiBody({
        type: UpdateContactStatusDto,
    })
    async updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: UpdateContactStatusDto,
        @Req() req: any,
    ) {
        return this.contactService.updateContactStatus(id, body.status, req.user.id);
    }
}