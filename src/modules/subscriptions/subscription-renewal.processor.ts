import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SubscriptionsService } from './subscriptions.service';

@Injectable()
export class SubscriptionRenewalProcessor {
  private readonly logger = new Logger(SubscriptionRenewalProcessor.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  /*
  |--------------------------------------------------------------------------
  | AUTO RENEW SUBSCRIPTIONS & PROCESS EXPIRED TRIALS - EVERY HOUR AT MINUTE 0
  |--------------------------------------------------------------------------
  */
  @Cron('0 * * * *')
  async handleSubscriptionRenewals() {
    this.logger.log('Starting automated subscription renewals processing cron...');

    try {
      const result = await this.subscriptionsService.processRenewals();
      this.logger.log(
        `Subscription renewals processing completed: ${result.data.processedCount} processed`,
      );
    } catch (error) {
      this.logger.error('Error during subscription renewal processing:', error);
    }
  }
}
