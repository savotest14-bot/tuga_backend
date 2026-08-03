import { BadRequestException, Injectable } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionGuardService {
  /**
   * Asserts that a subscription has an active or trial status.
   * Throws a BadRequestException if the subscription status is invalid or inactive.
   */
  assertActiveSubscription(subscription: { status: SubscriptionStatus } | null | undefined): void {
    if (!subscription) {
      throw new BadRequestException('No active subscription plan found');
    }

    if (
      subscription.status !== SubscriptionStatus.ACTIVE &&
      subscription.status !== SubscriptionStatus.TRIAL
    ) {
      throw new BadRequestException(
        `Subscription feature blocked. Your subscription status is ${subscription.status}.`,
      );
    }
  }
}
