import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StripeService } from './stripe.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { NotificationService } from '../notification/notification.service';
import { BillingCycle } from '@prisma/client';
import Stripe from 'stripe';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly notificationService: NotificationService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Returns Stripe public configuration for clients.
   */
  getPaymentConfig() {
    return {
      publishableKey: this.stripeService.getPublishableKey(),
    };
  }

  /**
   * Creates a PaymentIntent for subscription purchase or upgrade.
   */
  async createPaymentIntent(userId: string, dto: CreatePaymentIntentDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { traderProfile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let amount = dto.amount;
    let currency = dto.currency || 'EUR';
    let description = 'TugaTrades Payment';
    let planId = dto.planId;
    let priceId = dto.priceId;

    // If plan and price IDs are provided, fetch exact price from database
    if (planId && priceId) {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });
      if (!plan) {
        throw new BadRequestException('Subscription plan not found');
      }

      const price = await this.prisma.subscriptionPrice.findUnique({
        where: { id: priceId },
      });
      if (!price) {
        throw new BadRequestException('Subscription price not found');
      }

      amount = dto.amount !== undefined && dto.amount !== null ? dto.amount : Number(price.amount);
      currency = price.currency || 'EUR';
      description = `Subscription: ${plan.name} (${price.billingCycle})`;
    }

    if (!amount || amount <= 0) {
      throw new BadRequestException('Valid payment amount is required');
    }

    // Get or create Stripe Customer
    let customerId: string | undefined;
    try {
      const customer = await this.stripeService.getOrCreateCustomer(
        user.id,
        user.email,
        user.fullName || undefined,
      );
      customerId = customer.id;

      // Update customer ID on trader's subscription if exists
      if (user.traderProfile) {
        await this.prisma.subscription
          .updateMany({
            where: { traderProfileId: user.traderProfile.id },
            data: { stripeCustomerId: customerId },
          })
          .catch(() => {});
      }
    } catch (err: any) {
      this.logger.warn(`Could not create/fetch customer in Stripe: ${err.message}`);
    }

    const metadata: Record<string, string> = {
      userId: user.id,
      traderProfileId: user.traderProfile?.id || '',
      planId: planId || '',
      priceId: priceId || '',
    };

    const paymentIntent = await this.stripeService.createPaymentIntent({
      amount,
      currency,
      customerId,
      description,
      metadata,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      currency: currency.toUpperCase(),
      publishableKey: this.stripeService.getPublishableKey(),
    };
  }

  /**
   * Confirms payment and activates / updates trader subscription.
   */
  async confirmPayment(userId: string, dto: ConfirmPaymentDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        traderProfile: {
          include: { subscription: true },
        },
      },
    });

    if (!user || !user.traderProfile) {
      throw new NotFoundException('Trader profile not found');
    }

    const traderProfile = user.traderProfile;

    // Retrieve PaymentIntent from Stripe
    const paymentIntent = await this.stripeService.retrievePaymentIntent(
      dto.paymentIntentId,
    );

    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException(
        `Payment has not succeeded. Current status: ${paymentIntent.status}`,
      );
    }

    // Idempotency: Check if this transaction has already been processed
    const existingPayment = await this.prisma.subscriptionPayment.findFirst({
      where: { transactionId: paymentIntent.id },
    });

    if (existingPayment) {
      return {
        success: true,
        message: 'Payment already processed',
        payment: existingPayment,
        subscription: traderProfile.subscription,
      };
    }

    // Determine target plan & price from DTO or metadata
    const planId = dto.planId || paymentIntent.metadata?.planId;
    const priceId = dto.priceId || paymentIntent.metadata?.priceId;

    const amount = paymentIntent.amount / 100;
    const currency = paymentIntent.currency.toUpperCase();
    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      let targetPlan: any = null;
      let targetPrice: any = null;

      if (planId && priceId) {
        targetPlan = await tx.subscriptionPlan.findUnique({ where: { id: planId } });
        targetPrice = await tx.subscriptionPrice.findUnique({ where: { id: priceId } });
      }

      // 1. Ensure Subscription exists or update existing one
      let subscription = traderProfile.subscription;

      if (targetPlan && targetPrice) {
        const nextBillingDate = new Date(now);
        if (targetPrice.billingCycle === BillingCycle.YEARLY) {
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        } else {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        }

        if (subscription) {
          subscription = await tx.subscription.update({
            where: { id: subscription.id },
            data: {
              planId: targetPlan.id,
              currentPlanId: targetPlan.id,
              priceId: targetPrice.id,
              billingCycle: targetPrice.billingCycle,
              status: 'ACTIVE',
              isTrial: false,
              lastChargedAmount: amount,
              nextBillingAmount: targetPrice.amount,
              nextBillingDate,
              failedPaymentCount: 0,
              stripeCustomerId: (paymentIntent.customer as string) || subscription.stripeCustomerId,
              updatedAt: now,
            },
          });
        } else {
          subscription = await tx.subscription.create({
            data: {
              traderProfileId: traderProfile.id,
              startDate: now,
              planId: targetPlan.id,
              currentPlanId: targetPlan.id,
              priceId: targetPrice.id,
              billingCycle: targetPrice.billingCycle,
              status: 'ACTIVE',
              isTrial: false,
              lastChargedAmount: amount,
              nextBillingAmount: targetPrice.amount,
              nextBillingDate,
              failedPaymentCount: 0,
              stripeCustomerId: (paymentIntent.customer as string) || null,
            },
          });
        }

        // Update Trader Profile tier and reset categories if plan changed
        const isPlanChanged = traderProfile.subscriptionTier !== targetPlan.name;
        await tx.traderProfile.update({
          where: { id: traderProfile.id },
          data: {
            subscriptionTier: targetPlan.name,
            subscriptionStatus: 'ACTIVE',
            subscriptionStartDate: now,
            subscriptionEndDate: nextBillingDate,
            ...(isPlanChanged ? {
              tradeCategories: [],
              skillsServices: [],
              subCategories: [],
            } : {}),
          },
        });

        // 2. Record Subscription History
        await tx.subscriptionHistory.create({
          data: {
            subscriptionId: subscription.id,
            fromPlanId: traderProfile.subscription?.planId || null,
            toPlanId: targetPlan.id,
            action: traderProfile.subscription ? 'PLAN_UPGRADE' : 'INITIAL_PURCHASE',
            amount,
            billingCycle: targetPrice.billingCycle,
            effectiveDate: now,
          },
        });
      }

      if (!subscription) {
        throw new BadRequestException('No active subscription found to link payment to');
      }

      // 3. Create SubscriptionPayment record
      const payment = await tx.subscriptionPayment.create({
        data: {
          subscriptionId: subscription.id,
          amount,
          currency,
          status: 'SUCCESS',
          paymentProvider: 'STRIPE',
          transactionId: paymentIntent.id,
          paidAt: now,
        },
      });

      return { payment, subscription };
    });

    // Clear redis cache
    await this.redisService.del(`user:${userId}:profile`);
    await this.redisService.del(`admin:user-details:${userId}`);
    await this.redisService.del(`profile:${userId}`);
    await this.redisService.del(`registration-status:${userId}`);
    await this.redisService.deleteByPattern('traders:*');

    // Notify user
    await this.notificationService
      .createNotification(
        userId,
        'Payment Successful',
        `Your payment of €${amount.toFixed(2)} was successfully processed via Stripe.`,
        'PAYMENT_SUCCESS',
        { paymentId: result.payment.id, transactionId: paymentIntent.id },
      )
      .catch(() => {});

    return {
      success: true,
      message: 'Payment confirmed successfully',
      payment: result.payment,
      subscription: result.subscription,
    };
  }

  /**
   * Handles incoming Stripe Webhook events.
   */
  async handleWebhook(payload: Buffer, signature: string) {
    let event: Stripe.Event;

    try {
      event = this.stripeService.constructWebhookEvent(payload, signature);
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`Received Stripe Webhook: ${event.type} [${event.id}]`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.handlePaymentIntentSucceeded(paymentIntent);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.handlePaymentIntentFailed(paymentIntent);
        break;
      }
      default:
        this.logger.debug(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const { userId, traderProfileId, planId, priceId } = paymentIntent.metadata || {};

    if (!traderProfileId) {
      this.logger.warn(`PaymentIntent ${paymentIntent.id} succeeded without traderProfileId metadata`);
      return;
    }

    // Idempotency check
    const existing = await this.prisma.subscriptionPayment.findFirst({
      where: { transactionId: paymentIntent.id },
    });
    if (existing) {
      return;
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { traderProfileId },
    });

    if (subscription) {
      await this.prisma.subscriptionPayment.create({
        data: {
          subscriptionId: subscription.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          status: 'SUCCESS',
          paymentProvider: 'STRIPE',
          transactionId: paymentIntent.id,
          paidAt: new Date(),
        },
      });

      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          failedPaymentCount: 0,
        },
      });
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const { traderProfileId } = paymentIntent.metadata || {};
    if (!traderProfileId) return;

    const subscription = await this.prisma.subscription.findUnique({
      where: { traderProfileId },
    });

    if (subscription) {
      await this.prisma.subscriptionPayment.create({
        data: {
          subscriptionId: subscription.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          status: 'FAILED',
          paymentProvider: 'STRIPE',
          transactionId: paymentIntent.id,
          failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
        },
      });

      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          failedPaymentCount: { increment: 1 },
        },
      });
    }
  }

  /**
   * Retrieves payment transaction history for a trader.
   */
  async getPaymentHistory(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        traderProfile: {
          include: {
            subscription: {
              include: {
                payments: {
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.traderProfile || !user.traderProfile.subscription) {
      return [];
    }

    return user.traderProfile.subscription.payments;
  }
}
