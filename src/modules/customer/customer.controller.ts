// customer.controller.ts

import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import {
  CustomerService,
} from './customer.service';

import type { Request }
  from 'express';
import { GetSavedTradersDto } from './dto/get-saved-trader.dto';

@ApiTags('Customer')
@Controller('customer')
export class CustomerController {

  constructor(
    private readonly customerService: CustomerService,
  ) { }

  // =========================
  // SEARCH TRADERS
  // =========================


  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
  })

  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
  })

  @ApiQuery({
    name: 'search',
    required: false,
    example: 'Electrician',
  })

  @ApiQuery({
    name: 'categoryId',
    required: false,
    example: 'category-id',
  })

  @ApiQuery({
    name: 'verified',
    required: false,
    example: true,
  })
  @ApiQuery({
    name: 'latitude',
    required: false,
    example: 51.5072,
  })

  @ApiQuery({
    name: 'longitude',
    required: false,
    example: 0.1276,
  })
  @ApiQuery({
    name: 'topRated',
    required: false,
    example: true,
  })

  @Get('search-traders')
  async searchTraders(

    @Req()
    req: any,

    @Query('page')
    page: number = 1,

    @Query('limit')
    limit: number = 10,

    @Query('search')
    search?: string,

    @Query('categoryId')
    categoryId?: string,

    @Query('verified')
    verified?: string,

    @Query('latitude')
    latitude?: string,

    @Query('longitude')
    longitude?: string,

    @Query('topRated')
    topRated?: string,
  ) {

    return this.customerService.searchTraders(

      Number(page),

      Number(limit),

      search,

      categoryId,

      verified,

      topRated,

      latitude
        ? Number(latitude)
        : undefined,

      longitude
        ? Number(longitude)
        : undefined,
    );
  }

  @Post(':traderId/toggle-save')
  @ApiBearerAuth('access-token')
  async toggleSaveTrader(
    @Req() req: Request,
    @Param('traderId') traderId: string,
  ) {
    return this.customerService.toggleSaveTrader(
      req['user'].id,
      traderId,
    );
  }

  @Get('/get-save-traders')
  @ApiBearerAuth('access-token')
  async getSavedTraders(
    @Req() req: Request,
    @Query() query: GetSavedTradersDto,
  ) {
    return this.customerService.getSavedTraders(
      req['user'].id,
      query,
    );
  }
}