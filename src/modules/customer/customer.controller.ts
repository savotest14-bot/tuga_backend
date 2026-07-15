// customer.controller.ts

import {
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
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import {
  CustomerService,
} from './customer.service';

import type { Request }
  from 'express';
import { GetSavedTradersDto } from './dto/get-saved-trader.dto';
import { SearchTradersQueryDto } from './dto/search-traders-query.dto';
import { GetTraderReviewsQueryDto } from '../review/dto/get-trader-reviews-query.dto';

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
    name: 'skillService',
    required: false,
    example: 'skill-service-id',
  })
  @ApiQuery({
    name: 'subCategory',
    required: false,
    example: 'sub-category-id',
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

    @Query()
    query: SearchTradersQueryDto,
  ) {

    return this.customerService.searchTraders(
      query.page ?? 1,
      query.limit ?? 10,
      query.search,
      query.categoryId,
      query.skillService,
      query.subCategory,
      query.verified !== undefined ? String(query.verified) : undefined,
      query.topRated !== undefined ? String(query.topRated) : undefined,
      query.latitude,
      query.longitude,
    );
  }

  @Post(':traderId/toggle-save')
  @ApiBearerAuth('access-token')
  async toggleSaveTrader(
    @Req() req: Request,
    @Param('traderId', ParseUUIDPipe) traderId: string,
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

  @Get('traders/:traderId')
  @ApiBearerAuth('access-token')
  getTraderProfile(
    @Param('traderId', ParseUUIDPipe) traderId: string,
    @Req() req: any,
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
  ) {
    return this.customerService.getTraderProfile(
      traderId,
      req.user.id,
      latitude,
      longitude,
    );
  }

  @Get('public/traders/:traderId')
  getPublicTraderProfile(
    @Param('traderId', ParseUUIDPipe) traderId: string,
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
  ) {
    return this.customerService.getPublicTraderProfile(
      traderId,
      latitude,
      longitude,
    );
  }

}