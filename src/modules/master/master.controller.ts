import {
  Body,
  Controller,
  Param,
  Get,
  Post,
  Patch,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger';

import { MasterService } from './master.service';

import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSkillServiceDto } from './dto/create-skill-service.dto';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateSkillServiceDto } from './dto/update-skill-service.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';

import { multerOptions } from '../../common/helpers/multer.helper';


@Controller('master')
export class MasterController {
  constructor(
    private masterService: MasterService,
  ) { }

  // Create Category
  @ApiTags('Master')
  @ApiBearerAuth('access-token')
  @Post('category')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',

      properties: {
        name: {
          type: 'string',
          example: 'Plumbing',
        },

        image: {
          type: 'string',
          format: 'binary',
        },
      },

      required: ['name'],
    },
  })
  @UseInterceptors(
    FileInterceptor(
      'image',
      multerOptions('categories'),
    ),
  )
  createCategory(
    @Body()
    body: CreateCategoryDto,

    @UploadedFile()
    file?: Express.Multer.File,
  ) {
    return this.masterService.createCategory(
      body,
      file,
    );
  }

  // Create Skill Service
  @ApiTags('Master')
  @ApiBearerAuth('access-token')
  @Post('skill-service')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',

      properties: {
        categoryId: {
          type: 'string',
          example: 'category-uuid',
        },

        name: {
          type: 'string',
          example:
            'Pipe Installation',
        },

        image: {
          type: 'string',
          format: 'binary',
        },
      },

      required: [
        'categoryId',
        'name',
      ],
    },
  })
  @UseInterceptors(
    FileInterceptor(
      'image',
      multerOptions(
        'skill-services',
      ),
    ),
  )
  createSkillService(
    @Body()
    body: CreateSkillServiceDto,

    @UploadedFile()
    file?: Express.Multer.File,
  ) {
    return this.masterService.createSkillService(
      body,
      file,
    );
  }

  // Create Sub Category
  @ApiTags('Master')
  @ApiBearerAuth('access-token')
  @Post('sub-category')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',

      properties: {
        skillServiceId: {
          type: 'string',
          example:
            'skill-service-uuid',
        },

        name: {
          type: 'string',
          example:
            'Bathroom Pipe Installation',
        },

        image: {
          type: 'string',
          format: 'binary',
        },
      },

      required: [
        'skillServiceId',
        'name',
      ],
    },
  })
  @UseInterceptors(
    FileInterceptor(
      'image',
      multerOptions(
        'sub-categories',
      ),
    ),
  )
  createSubCategory(
    @Body()
    body: CreateSubCategoryDto,

    @UploadedFile()
    file?: Express.Multer.File,
  ) {
    return this.masterService.createSubCategory(
      body,
      file,
    );
  }

  // Get All Categories
  @Get('categories')
  getAllCategories() {
    return this.masterService.getAllCategories();
  }

  // Get Skill Services By Category
  @Get(
    'skill-services/:categoryId',
  )
  getSkillServicesByCategory(
    @Param('categoryId')
    categoryId: string,
  ) {
    return this.masterService.getSkillServicesByCategory(
      categoryId,
    );
  }

  // Get Sub Categories By Skill Service
  @Get(
    'sub-categories/:skillServiceId',
  )
  getSubCategoriesBySkillService(
    @Param('skillServiceId')
    skillServiceId: string,
  ) {
    return this.masterService.getSubCategoriesBySkillService(
      skillServiceId,
    );
  }

  @ApiTags('Master')
  @ApiBearerAuth('access-token')
  @Patch('category/:id/toggle')
  toggleCategory(
    @Param('id')
    id: string,
  ) {
    return this.masterService.toggleCategory(
      id,
    );
  }

  // Toggle Skill Service Status
  @ApiTags('Master')
  @ApiBearerAuth('access-token')
  @Patch('skill-service/:id/toggle')
  toggleSkillService(
    @Param('id')
    id: string,
  ) {
    return this.masterService.toggleSkillService(
      id,
    );
  }

  // Toggle Sub Category Status
  @ApiTags('Master')
  @ApiBearerAuth('access-token')
  @Patch('sub-category/:id/toggle')
  toggleSubCategory(
    @Param('id')
    id: string,
  ) {
    return this.masterService.toggleSubCategory(
      id,
    );
  }

  @ApiTags('Master')
  @ApiBearerAuth('access-token')
  @Patch('category/:id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',

      properties: {
        name: {
          type: 'string',
          example: 'Updated Plumbing',
        },

        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor(
      'image',
      multerOptions('categories'),
    ),
  )
  updateCategory(
    @Param('id')
    id: string,

    @Body()
    body: UpdateCategoryDto,

    @UploadedFile()
    file?: Express.Multer.File,
  ) {
    return this.masterService.updateCategory(
      id,
      body,
      file,
    );
  }

  @ApiTags('Master')
  @ApiBearerAuth('access-token')
  @Patch('skill-service/:id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',

      properties: {
        categoryId: {
          type: 'string',
        },

        name: {
          type: 'string',
        },

        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor(
      'image',
      multerOptions(
        'skill-services',
      ),
    ),
  )
  updateSkillService(
    @Param('id')
    id: string,

    @Body()
    body: UpdateSkillServiceDto,

    @UploadedFile()
    file?: Express.Multer.File,
  ) {
    return this.masterService.updateSkillService(
      id,
      body,
      file,
    );
  }

  @ApiTags('Master')
  @ApiBearerAuth('access-token')
  @Patch('sub-category/:id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',

      properties: {
        skillServiceId: {
          type: 'string',
        },

        name: {
          type: 'string',
        },

        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor(
      'image',
      multerOptions(
        'sub-categories',
      ),
    ),
  )
  updateSubCategory(
    @Param('id')
    id: string,

    @Body()
    body: UpdateSubCategoryDto,

    @UploadedFile()
    file?: Express.Multer.File,
  ) {
    return this.masterService.updateSubCategory(
      id,
      body,
      file,
    );
  }

}