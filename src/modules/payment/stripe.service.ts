import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe | null = null;
  private publishableKey: string = '';

  constructor(private readonly configService: ConfigService) {
    this.initStripe();
  }

  private initStripe() {
    const secretKey =
      this.configService.get<string>('STRIPE_SECRET_KEY') ||
      process.env.STRIPE_SECRET_KEY;
    this.publishableKey =
      this.configService.get<string>('STRIPE_PUBLISHABLE_KEY') ||
      process.env.STRIPE_PUBLISHABLE_KEY ||
      '';

    if (secretKey) {
      this.stripe = new Stripe(secretKey);
      this.logger.log('Stripe client successfully initialized');
    } else {
      this.logger.warn('STRIPE_SECRET_KEY is not defined in environment variables');
    }
  }

  public getStripeClient(): Stripe {
    if (!this.stripe) {
      this.initStripe();
    }
    if (!this.stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY in .env');
    }
    return this.stripe;
  }

  public isConfigured(): boolean {
    return !!(this.stripe || process.env.STRIPE_SECRET_KEY);
  }

  public getPublishableKey(): string {
    return (
      this.publishableKey ||
      this.configService.get<string>('STRIPE_PUBLISHABLE_KEY') ||
      process.env.STRIPE_PUBLISHABLE_KEY ||
      ''
    );
  }

  /**
   * Retrieves an existing Stripe Customer or creates a new one.
   */
  async getOrCreateCustomer(
    userId: string,
    email: string,
    name?: string,
  ): Promise<Stripe.Customer> {
    const stripe = this.getStripeClient();

    try {
      // Search for customer by email
      const existingCustomers = await stripe.customers.list({
        email: email.toLowerCase(),
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0];
      }

      // Create new customer
      const newCustomer = await stripe.customers.create({
        email: email.toLowerCase(),
        name: name || undefined,
        metadata: {
          userId,
        },
      });

      this.logger.log(`Created new Stripe Customer: ${newCustomer.id} for user: ${userId}`);
      return newCustomer;
    } catch (error: any) {
      this.logger.error(`Error in getOrCreateCustomer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Creates a PaymentIntent for subscription or one-time payments.
   */
  async createPaymentIntent(params: {
    amount: number;
    currency?: string;
    customerId?: string;
    metadata?: Record<string, string>;
    description?: string;
  }): Promise<Stripe.PaymentIntent> {
    const stripe = this.getStripeClient();
    const currency = (params.currency || 'EUR').toLowerCase();
    // Stripe expects amount in smallest currency unit (e.g. cents)
    const amountInCents = Math.round(params.amount * 100);

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency,
        customer: params.customerId,
        metadata: params.metadata || {},
        description: params.description || 'TugaTrades Payment',
        automatic_payment_methods: {
          enabled: true,
        },
      });

      this.logger.log(
        `Created PaymentIntent ${paymentIntent.id} for amount: ${params.amount} ${currency.toUpperCase()}`,
      );
      return paymentIntent;
    } catch (error: any) {
      this.logger.error(`Failed to create PaymentIntent: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves details of a PaymentIntent.
   */
  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    const stripe = this.getStripeClient();
    try {
      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error: any) {
      this.logger.error(`Failed to retrieve PaymentIntent ${paymentIntentId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Creates a Stripe Checkout Session (for web redirection / hosted checkout).
   */
  async createCheckoutSession(params: {
    customerId?: string;
    amount: number;
    currency?: string;
    successUrl: string;
    cancelUrl: string;
    productName: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    const stripe = this.getStripeClient();
    const currency = (params.currency || 'EUR').toLowerCase();
    const amountInCents = Math.round(params.amount * 100);

    try {
      const session = await stripe.checkout.sessions.create({
        customer: params.customerId,
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: params.productName,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata || {},
      });

      return session;
    } catch (error: any) {
      this.logger.error(`Failed to create Checkout Session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validates and constructs a Stripe Webhook Event.
   */
  constructWebhookEvent(
    payload: Buffer,
    signature: string,
    secret?: string,
  ): Stripe.Event {
    const stripe = this.getStripeClient();
    const webhookSecret =
      secret ||
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET') ||
      process.env.STRIPE_WEBHOOK_SECRET ||
      '';

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}
