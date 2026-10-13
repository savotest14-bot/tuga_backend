import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { PaymentService } from './payment.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /*
  |--------------------------------------------------------------------------
  | GET STRIPE CONFIG
  |--------------------------------------------------------------------------
  */
  @Get('config')
  @ApiOperation({
    summary: 'Get Stripe publishable key configuration',
  })
  getConfig() {
    return this.paymentService.getPaymentConfig();
  }

  /*
  |--------------------------------------------------------------------------
  | CREATE PAYMENT INTENT
  |--------------------------------------------------------------------------
  */
  @Post('create-intent')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create a Stripe PaymentIntent for subscription plan or custom amount',
  })
  async createPaymentIntent(
    @Req() req: Request,
    @Body() dto: CreatePaymentIntentDto,
  ) {
    const userId = (req as any).user.id;
    return this.paymentService.createPaymentIntent(userId, dto);
  }

  /*
  |--------------------------------------------------------------------------
  | CONFIRM PAYMENT
  |--------------------------------------------------------------------------
  */
  @Post('confirm')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Confirm a completed Stripe payment and activate/upgrade subscription',
  })
  async confirmPayment(
    @Req() req: Request,
    @Body() dto: ConfirmPaymentDto,
  ) {
    const userId = (req as any).user.id;
    return this.paymentService.confirmPayment(userId, dto);
  }

  /*
  |--------------------------------------------------------------------------
  | GET PAYMENT HISTORY
  |--------------------------------------------------------------------------
  */
  @Get('history')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get subscription payment history for the authenticated trader',
  })
  async getPaymentHistory(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.paymentService.getPaymentHistory(userId);
  }

  /*
  |--------------------------------------------------------------------------
  | STRIPE WEBHOOK
  |--------------------------------------------------------------------------
  */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stripe webhook receiver for asynchronous payment events',
  })
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    // rawBody is populated by NestFactory.create(AppModule, { rawBody: true })
    const rawBody = (req as any).rawBody || (req as any).body;
    return this.paymentService.handleWebhook(rawBody, signature);
  }
}
