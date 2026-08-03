import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { BillingCycle, SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import { ChangePlanDto } from './dto/change-plan.dto';
import { randomUUID } from 'crypto';

const TIER_RANK: Record<SubscriptionTier, number> = {
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
};

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

    const targetBillingCycle = dto.billingCycle || subscription.billingCycle;

    const currentPlanId =
      subscription.currentPlanId || subscription.planId;
    const currentPlan =
      subscription.currentPlan || subscription.plan;

    const currentRank = TIER_RANK[currentPlan.name] || 0;
    const targetRank = TIER_RANK[targetPlan.name] || 0;

    const isTierChanging = currentPlanId !== targetPlan.id;
    const isCycleChanging = subscription.billingCycle !== targetBillingCycle;

    // Check if user is attempting to select identical plan and billing cycle
    if (!isTierChanging && !isCycleChanging) {
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

    // Check if target plan is already scheduled as pending plan (if same billing cycle)
    if (subscription.pendingPlanId === targetPlan.id && !isCycleChanging) {
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

    // Determine target price for selected billing cycle
    const targetPrice = targetPlan.prices.find(
      (p) => p.billingCycle === targetBillingCycle,
    );

    if (!targetPrice) {
      throw new BadRequestException(
        `No active price available for this plan under ${targetBillingCycle} billing cycle`,
      );
    }

    const now = new Date();
    const isTrial =
      subscription.isTrial ||
      subscription.status === SubscriptionStatus.TRIAL ||
      (subscription.trialEndsAt && now < subscription.trialEndsAt);

    /*
    |--------------------------------------------------------------------------
    | TRIAL MODE: FREE UNLIMITED SWITCHING (NO PAYMENTS, NO HISTORY)
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
            billingCycle: targetBillingCycle,
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
    | POST-TRIAL MODE: UPGRADE, BILLING CYCLE SWITCH, OR DOWNGRADE
    |--------------------------------------------------------------------------
    */
    const currentPriceAmount = Number(subscription.price?.amount || 0);
    const targetPriceAmount = Number(targetPrice.amount);

    const currentPeriodStart =
      subscription.currentPeriodStart || subscription.startDate || now;

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

    // Determine if operation is an Upgrade/Cycle Change or a Downgrade
    const isUpgradeOrCycleSwitch =
      targetRank > currentRank || (!isTierChanging && isCycleChanging);

    if (isUpgradeOrCycleSwitch) {
      let proratedAmount = 0;

      if (isCycleChanging && !isTierChanging) {
        // Billing cycle switch on same plan
        proratedAmount = targetPriceAmount;
      } else {
        // Tier upgrade
        const priceDiff = targetPriceAmount - currentPriceAmount;

        if (priceDiff > 0) {
          const remainingMs = currentPeriodEnd.getTime() - now.getTime();
          const remainingDays = Math.max(0, remainingMs / (1000 * 60 * 60 * 24));

          if (subscription.billingCycle === BillingCycle.MONTHLY) {
            const totalMs = currentPeriodEnd.getTime() - currentPeriodStart.getTime();
            const totalDays = Math.max(1, totalMs / (1000 * 60 * 60 * 24));
            proratedAmount = priceDiff * (remainingDays / totalDays);
          } else {
            // YEARLY
            proratedAmount = priceDiff * (remainingDays / 365);
          }
          proratedAmount = Math.round(proratedAmount * 100) / 100;
        } else {
          proratedAmount = Math.round(targetPriceAmount * 100) / 100;
        }
      }

      // Calculate new period dates if billing cycle changed
      let newPeriodStart = currentPeriodStart;
      let newPeriodEnd = currentPeriodEnd;

      if (isCycleChanging) {
        newPeriodStart = now;
        newPeriodEnd = new Date(now);
        if (targetBillingCycle === BillingCycle.MONTHLY) {
          newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
        } else {
          newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
        }
      }

      const action = isCycleChanging && !isTierChanging ? 'BILLING_CYCLE_CHANGE' : 'UPGRADE';

      const updatedSub = await this.prisma.$transaction(async (tx) => {
        const txnId = `txn_upg_${Date.now()}_${randomUUID().substring(0, 8)}`;

        // Create Payment
        await tx.subscriptionPayment.create({
          data: {
            subscriptionId: subscription.id,
            amount: proratedAmount,
            currency: targetPrice.currency || 'EUR',
            status: 'SUCCESS',
            paymentProvider: 'STRIPE',
            transactionId: txnId,
            paidAt: now,
          },
        });

        // Save Subscription History
        await tx.subscriptionHistory.create({
          data: {
            subscriptionId: subscription.id,
            fromPlanId: currentPlanId,
            toPlanId: targetPlan.id,
            action,
            amount: proratedAmount,
            proratedAmount: proratedAmount,
            billingCycle: targetBillingCycle,
            effectiveDate: now,
          },
        });

        // Update Subscription
        const sub = await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            currentPlanId: targetPlan.id,
            planId: targetPlan.id,
            priceId: targetPrice.id,
            billingCycle: targetBillingCycle,
            pendingPlanId: null,
            lastChargedAmount: proratedAmount,
            nextBillingAmount: targetPrice.amount,
            lastPlanChangeAt: now,
            ...(isCycleChanging ? {
              currentPeriodStart: newPeriodStart,
              currentPeriodEnd: newPeriodEnd,
              startDate: newPeriodStart,
              endDate: newPeriodEnd,
            } : {}),
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
            ...(isCycleChanging ? {
              subscriptionStartDate: newPeriodStart,
              subscriptionEndDate: newPeriodEnd,
            } : {}),
          },
        });

        return sub;
      });

      const message = isCycleChanging && !isTierChanging
        ? 'Billing cycle updated successfully'
        : 'Subscription upgraded successfully';

      return {
        success: true,
        message,
        data: {
          currentPlan: updatedSub.currentPlan || targetPlan,
          pendingPlan: null,
          trial: false,
          proratedAmount,
          effectiveDate: newPeriodEnd,
        },
      };
    }

    // DOWNGRADE: targetRank < currentRank
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
          billingCycle: targetBillingCycle,
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

    // During trial, currentPeriodStart should reflect when the trial began (or start date)
    const currentPeriodStart = isTrial
      ? sub.trialStartDate || sub.startDate || now
      : sub.currentPeriodStart || sub.startDate;

    const currentPeriodEnd = isTrial
      ? sub.trialEndsAt || sub.trialEndDate || sub.endDate
      : sub.currentPeriodEnd || sub.endDate;

    return {
      success: true,
      message: 'Subscription retrieved successfully',
      data: {
        currentPlan: sub.currentPlan || sub.plan,
        pendingPlan: sub.pendingPlan || null,
        trial: isTrial,
        trialEndsAt: sub.trialEndsAt || sub.trialEndDate,
        currentPeriodStart,
        currentPeriodEnd,
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
    const lockKey = 'lock:process-renewals';
    // Optional Redis lock to prevent duplicate execution across workers
    try {
      if (this.redisService) {
        const acquired = await this.redisService.set(lockKey, '1', 300);
        if (acquired === null) {
          return { success: true, message: 'Renewal processing locked', data: { processedCount: 0 } };
        }
      }
    } catch (_) {
      // Continue if Redis is unavailable
    }

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

        const txnId = `txn_ren_${Date.now()}_${randomUUID().substring(0, 8)}`;

        await this.prisma.$transaction(async (tx) => {
          // Payment record
          await tx.subscriptionPayment.create({
            data: {
              subscriptionId: sub.id,
              amount: chargeAmount,
              currency: targetPrice.currency || 'EUR',
              status: 'SUCCESS',
              paymentProvider: 'STRIPE',
              transactionId: txnId,
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
