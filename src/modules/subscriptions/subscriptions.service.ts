import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { BillingCycle, SubscriptionStatus } from '@prisma/client';
import { ChangePlanDto } from './dto/change-plan.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  /*
  |--------------------------------------------------------------------------
  | CHANGE SUBSCRIPTION PLAN
  |--------------------------------------------------------------------------
  */
  async changePlan(userId: string, dto: ChangePlanDto) {
    const traderProfile = await this.prisma.traderProfile.findUnique({
      where: { userId },
      include: {
        subscription: {
          include: {
            plan: true,
            currentPlan: true,
            pendingPlan: true,
            price: true,
          },
        },
      },
    });

    if (!traderProfile || !traderProfile.subscription) {
      throw new NotFoundException('Subscription not found for trader');
    }

    const subscription = traderProfile.subscription;

    if (
      subscription.status === SubscriptionStatus.CANCELLED ||
      subscription.status === SubscriptionStatus.EXPIRED
    ) {
      throw new BadRequestException(
        'Cannot change plan on an expired or cancelled subscription',
      );
    }

    const targetPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
      include: {
        prices: {
          where: { isActive: true },
        },
      },
    });

    if (!targetPlan || !targetPlan.isActive) {
      throw new BadRequestException('Invalid or inactive plan selected');
    }

    const currentPlanId =
      subscription.currentPlanId || subscription.planId;
    const currentPlan =
      subscription.currentPlan || subscription.plan;

    // Check if target plan is the same as current active plan
    if (currentPlanId === targetPlan.id) {
      // If user had any pending downgrade/change and is now staying on current plan, clear pending
      if (subscription.pendingPlanId) {
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { pendingPlanId: null },
        });
        return {
          success: true,
          message: 'Pending plan change cleared. You remain on your current plan.',
          data: {
            currentPlan,
            pendingPlan: null,
            trial: subscription.isTrial,
            proratedAmount: 0,
            effectiveDate:
              subscription.currentPeriodEnd ||
              subscription.trialEndsAt ||
              subscription.trialEndDate ||
              subscription.endDate,
          },
        };
      }
      throw new BadRequestException(
        'You are already subscribed to this plan',
      );
    }

    // Check if target plan is already scheduled as pending plan
    if (subscription.pendingPlanId === targetPlan.id) {
      return {
        success: true,
        message: 'This plan is already scheduled as your pending downgrade.',
        data: {
          currentPlan,
          pendingPlan: targetPlan,
          trial: false,
          proratedAmount: 0,
          effectiveDate:
            subscription.currentPeriodEnd ||
            subscription.endDate,
        },
      };
    }

    // Determine target price for current billing cycle
    const targetPrice = targetPlan.prices.find(
      (p) => p.billingCycle === subscription.billingCycle,
    );

    if (!targetPrice) {
      throw new BadRequestException(
        `No active price available for this plan under ${subscription.billingCycle} billing cycle`,
      );
    }

    const now = new Date();
    const isTrial =
      subscription.isTrial ||
      subscription.status === SubscriptionStatus.TRIAL ||
      (subscription.trialEndsAt && now < subscription.trialEndsAt);

    /*
    |--------------------------------------------------------------------------
    | TRIAL MODE: FREE UNLIMITED SWITCHING
    |--------------------------------------------------------------------------
    */
    if (isTrial) {
      await this.prisma.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            currentPlanId: targetPlan.id,
            planId: targetPlan.id,
            priceId: targetPrice.id,
            pendingPlanId: null,
            lastPlanChangeAt: now,
          },
        });

        await tx.traderProfile.update({
          where: { id: traderProfile.id },
          data: {
            subscriptionTier: targetPlan.name,
          },
        });
      });

      const effectiveDate =
        subscription.trialEndsAt ||
        subscription.trialEndDate ||
        subscription.currentPeriodEnd ||
        subscription.endDate;

      return {
        success: true,
        message: 'Subscription plan updated successfully during trial',
        data: {
          currentPlan: targetPlan,
          pendingPlan: null,
          trial: true,
          proratedAmount: 0,
          effectiveDate,
        },
      };
    }

    /*
    |--------------------------------------------------------------------------
    | POST-TRIAL MODE: UPGRADE OR DOWNGRADE
    |--------------------------------------------------------------------------
    */
    const currentPriceAmount = Number(subscription.price?.amount || 0);
    const targetPriceAmount = Number(targetPrice.amount);

    const currentPeriodStart =
      subscription.currentPeriodStart || subscription.startDate || now;

    // Fallback currentPeriodEnd if missing
    let currentPeriodEnd =
      subscription.currentPeriodEnd || subscription.endDate;
    if (!currentPeriodEnd) {
      currentPeriodEnd = new Date(currentPeriodStart);
      if (subscription.billingCycle === BillingCycle.MONTHLY) {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      } else {
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      }
    }

    // UPGRADE: New Price > Old Price
    if (targetPriceAmount > currentPriceAmount) {
      const remainingMs = currentPeriodEnd.getTime() - now.getTime();
      const remainingDays = Math.max(0, remainingMs / (1000 * 60 * 60 * 24));

      let proratedAmount = 0;
      const priceDiff = targetPriceAmount - currentPriceAmount;

      if (subscription.billingCycle === BillingCycle.MONTHLY) {
        const totalMs = currentPeriodEnd.getTime() - currentPeriodStart.getTime();
        const totalDays = Math.max(1, totalMs / (1000 * 60 * 60 * 24));
        proratedAmount = priceDiff * (remainingDays / totalDays);
      } else {
        // YEARLY
        proratedAmount = priceDiff * (remainingDays / 365);
      }

      proratedAmount = Math.round(proratedAmount * 100) / 100;

      const updatedSub = await this.prisma.$transaction(async (tx) => {
        // Create Payment
        await tx.subscriptionPayment.create({
          data: {
            subscriptionId: subscription.id,
            amount: proratedAmount,
            currency: targetPrice.currency || 'EUR',
            status: 'SUCCESS',
            paymentProvider: 'STRIPE',
            transactionId: `txn_upg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            paidAt: now,
          },
        });

        // Save Subscription History
        await tx.subscriptionHistory.create({
          data: {
            subscriptionId: subscription.id,
            fromPlanId: currentPlanId,
            toPlanId: targetPlan.id,
            action: 'UPGRADE',
            amount: proratedAmount,
            proratedAmount: proratedAmount,
            billingCycle: subscription.billingCycle,
            effectiveDate: now,
          },
        });

        // Update Subscription (Keep same currentPeriodEnd!)
        const sub = await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            currentPlanId: targetPlan.id,
            planId: targetPlan.id,
            priceId: targetPrice.id,
            pendingPlanId: null,
            lastChargedAmount: proratedAmount,
            nextBillingAmount: targetPrice.amount,
            lastPlanChangeAt: now,
          },
          include: {
            currentPlan: true,
            pendingPlan: true,
          },
        });

        // Update Trader Profile
        await tx.traderProfile.update({
          where: { id: traderProfile.id },
          data: {
            subscriptionTier: targetPlan.name,
          },
        });

        return sub;
      });

      return {
        success: true,
        message: 'Subscription upgraded successfully',
        data: {
          currentPlan: updatedSub.currentPlan || targetPlan,
          pendingPlan: null,
          trial: false,
          proratedAmount,
          effectiveDate: currentPeriodEnd,
        },
      };
    }

    // DOWNGRADE: New Price < Old Price (or equal with different plan)
    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          pendingPlanId: targetPlan.id,
          lastPlanChangeAt: now,
        },
      });

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: subscription.id,
          fromPlanId: currentPlanId,
          toPlanId: targetPlan.id,
          action: 'DOWNGRADE_SCHEDULED',
          amount: 0,
          proratedAmount: 0,
          billingCycle: subscription.billingCycle,
          effectiveDate: currentPeriodEnd,
        },
      });
    });

    return {
      success: true,
      message: 'Your downgrade will take effect from your next billing cycle.',
      data: {
        currentPlan,
        pendingPlan: targetPlan,
        trial: false,
        proratedAmount: 0,
        effectiveDate: currentPeriodEnd,
      },
    };
  }

  /*
  |--------------------------------------------------------------------------
  | CANCEL PENDING DOWNGRADE / PLAN CHANGE
  |--------------------------------------------------------------------------
  */
  async cancelPendingDowngrade(userId: string) {
    const traderProfile = await this.prisma.traderProfile.findUnique({
      where: { userId },
      include: {
        subscription: {
          include: { currentPlan: true, plan: true },
        },
      },
    });

    if (!traderProfile || !traderProfile.subscription) {
      throw new NotFoundException('Subscription not found for trader');
    }

    const sub = traderProfile.subscription;
    if (!sub.pendingPlanId) {
      throw new BadRequestException('No pending plan change to cancel');
    }

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: { pendingPlanId: null },
    });

    return {
      success: true,
      message: 'Pending plan change cancelled successfully',
      data: {
        currentPlan: sub.currentPlan || sub.plan,
        pendingPlan: null,
        trial: sub.isTrial,
        proratedAmount: 0,
        effectiveDate: sub.currentPeriodEnd || sub.endDate,
      },
    };
  }

  /*
  |--------------------------------------------------------------------------
  | GET CURRENT TRADER SUBSCRIPTION DETAILS
  |--------------------------------------------------------------------------
  */
  async getMySubscription(userId: string) {
    const traderProfile = await this.prisma.traderProfile.findUnique({
      where: { userId },
      include: {
        subscription: {
          include: {
            plan: true,
            currentPlan: true,
            pendingPlan: true,
            price: true,
            history: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
      },
    });

    if (!traderProfile || !traderProfile.subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const sub = traderProfile.subscription;
    const now = new Date();
    const isTrial =
      sub.isTrial ||
      sub.status === SubscriptionStatus.TRIAL ||
      (sub.trialEndsAt && now < sub.trialEndsAt);

    return {
      success: true,
      message: 'Subscription retrieved successfully',
      data: {
        currentPlan: sub.currentPlan || sub.plan,
        pendingPlan: sub.pendingPlan || null,
        trial: isTrial,
        trialEndsAt: sub.trialEndsAt || sub.trialEndDate,
        currentPeriodStart: sub.currentPeriodStart || sub.startDate,
        currentPeriodEnd: sub.currentPeriodEnd || sub.endDate,
        billingCycle: sub.billingCycle,
        status: sub.status,
        lastChargedAmount: sub.lastChargedAmount,
        nextBillingAmount: sub.nextBillingAmount,
        history: sub.history,
      },
    };
  }

  /*
  |--------------------------------------------------------------------------
  | PROCESS SUBSCRIPTION RENEWALS (EXPIRING TRIALS & PERIOD RENEWALS)
  |--------------------------------------------------------------------------
  */
  async processRenewals() {
    const now = new Date();

    const dueSubscriptions = await this.prisma.subscription.findMany({
      where: {
        OR: [
          // Expiring Trials
          {
            isTrial: true,
            trialEndsAt: { lte: now },
          },
          {
            status: SubscriptionStatus.TRIAL,
            trialEndDate: { lte: now },
          },
          // Period End Renewals
          {
            status: SubscriptionStatus.ACTIVE,
            currentPeriodEnd: { lte: now },
          },
          {
            status: SubscriptionStatus.ACTIVE,
            endDate: { lte: now },
          },
        ],
      },
      include: {
        traderProfile: true,
        plan: true,
        currentPlan: true,
        pendingPlan: true,
        price: true,
      },
    });

    let processedCount = 0;

    for (const sub of dueSubscriptions) {
      try {
        const isTrialExpiring =
          sub.isTrial || sub.status === SubscriptionStatus.TRIAL;

        // Determine plan to activate (pending plan if set, else current plan)
        const targetPlanId = sub.pendingPlanId || sub.currentPlanId || sub.planId;

        const targetPlan = await this.prisma.subscriptionPlan.findUnique({
          where: { id: targetPlanId },
          include: {
            prices: {
              where: { isActive: true },
            },
          },
        });

        if (!targetPlan) continue;

        const targetPrice = targetPlan.prices.find(
          (p) => p.billingCycle === sub.billingCycle,
        );

        if (!targetPrice) continue;

        const chargeAmount = Number(targetPrice.amount);

        // Calculate next period dates
        const periodStart = new Date(now);
        const periodEnd = new Date(now);

        if (sub.billingCycle === BillingCycle.MONTHLY) {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        } else {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        }

        const action = isTrialExpiring
          ? 'TRIAL_EXPIRATION_RENEWAL'
          : sub.pendingPlanId
          ? 'DOWNGRADE_APPLIED'
          : 'RENEWAL';

        await this.prisma.$transaction(async (tx) => {
          // Payment record
          await tx.subscriptionPayment.create({
            data: {
              subscriptionId: sub.id,
              amount: chargeAmount,
              currency: targetPrice.currency || 'EUR',
              status: 'SUCCESS',
              paymentProvider: 'STRIPE',
              transactionId: `txn_ren_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              paidAt: now,
            },
          });

          // History record
          await tx.subscriptionHistory.create({
            data: {
              subscriptionId: sub.id,
              fromPlanId: sub.currentPlanId || sub.planId,
              toPlanId: targetPlan.id,
              action,
              amount: chargeAmount,
              proratedAmount: 0,
              billingCycle: sub.billingCycle,
              effectiveDate: now,
            },
          });

          // Update Subscription
          await tx.subscription.update({
            where: { id: sub.id },
            data: {
              currentPlanId: targetPlan.id,
              planId: targetPlan.id,
              priceId: targetPrice.id,
              pendingPlanId: null,
              isTrial: false,
              status: SubscriptionStatus.ACTIVE,
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              startDate: periodStart,
              endDate: periodEnd,
              nextBillingDate: periodEnd,
              lastChargedAmount: chargeAmount,
              nextBillingAmount: chargeAmount,
            },
          });

          // Update Trader Profile
          await tx.traderProfile.update({
            where: { id: sub.traderProfileId },
            data: {
              subscriptionTier: targetPlan.name,
              subscriptionStatus: SubscriptionStatus.ACTIVE,
              subscriptionStartDate: periodStart,
              subscriptionEndDate: periodEnd,
            },
          });
        });

        processedCount++;
      } catch (err) {
        console.error(`Failed to process renewal for subscription ${sub.id}:`, err);
      }
    }

    return {
      success: true,
      message: `Processed ${processedCount} renewals`,
      data: { processedCount },
    };
  }
}
