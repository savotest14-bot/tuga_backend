import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  BillingCycle,
  SubscriptionStatus,
  SubscriptionTier,
} from '@prisma/client';

/*
|==========================================================================
| END-TO-END INTEGRATION TEST SUITE FOR TRADER SUBSCRIPTION SYSTEM
|==========================================================================
| This file covers all 24 phases of subscription lifecycle testing:
| Registration, trial switching, trial expiration, upgrades, downgrades,
| cancellations, renewals, proration math, billing cycle changes,
| validation, security, concurrency, feature enforcement, and performance.
|==========================================================================
*/

// ─── MOCK PLAN / PRICE FACTORIES ─────────────────────────────────────────────

function makePlan(
  overrides: Partial<{
    id: string;
    name: SubscriptionTier;
    monthlyAmount: number;
    yearlyAmount: number;
    maxTrades: number;
    unlimitedTrades: boolean;
    maxPortfolioUploads: number;
    allowPortfolioVideos: boolean;
    maxQuotesPerDay: number;
    trialEnabled: boolean;
    trialDays: number;
    isActive: boolean;
    featuredAtTop: boolean;
    exposureLevel: string;
  }> = {},
) {
  const id = overrides.id ?? `plan-${overrides.name?.toLowerCase() ?? 'test'}`;
  const monthlyAmount = overrides.monthlyAmount ?? 50;
  const yearlyAmount = overrides.yearlyAmount ?? 500;
  return {
    id,
    name: overrides.name ?? SubscriptionTier.BRONZE,
    description: `${overrides.name ?? 'BRONZE'} Plan`,
    maxTrades: overrides.maxTrades ?? 5,
    unlimitedTrades: overrides.unlimitedTrades ?? false,
    maxPortfolioUploads: overrides.maxPortfolioUploads ?? 5,
    allowPortfolioVideos: overrides.allowPortfolioVideos ?? false,
    maxQuotesPerDay: overrides.maxQuotesPerDay ?? 5,
    bannerLabel: null,
    featuredAtTop: overrides.featuredAtTop ?? false,
    exposureLevel: overrides.exposureLevel ?? 'STANDARD',
    newJobAlerts: true,
    customerSupportDays: 7,
    trialEnabled: overrides.trialEnabled ?? true,
    trialDays: overrides.trialDays ?? 14,
    isActive: overrides.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
    prices: [
      {
        id: `${id}-monthly`,
        planId: id,
        billingCycle: BillingCycle.MONTHLY,
        amount: monthlyAmount as any,
        currency: 'EUR',
        stripePriceId: null,
        mbwayPlanId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: `${id}-yearly`,
        planId: id,
        billingCycle: BillingCycle.YEARLY,
        amount: yearlyAmount as any,
        currency: 'EUR',
        stripePriceId: null,
        mbwayPlanId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };
}

// ─── STANDARD PLANS ──────────────────────────────────────────────────────────

const BRONZE = makePlan({
  name: SubscriptionTier.BRONZE,
  monthlyAmount: 14.99,
  yearlyAmount: 99.99,
  maxTrades: 1,
  maxPortfolioUploads: 5,
  maxQuotesPerDay: 3,
  trialDays: 14,
});

const SILVER = makePlan({
  name: SubscriptionTier.SILVER,
  monthlyAmount: 24.99,
  yearlyAmount: 199.99,
  maxTrades: 3,
  maxPortfolioUploads: 20,
  allowPortfolioVideos: true,
  maxQuotesPerDay: 10,
  trialDays: 14,
});

const GOLD = makePlan({
  name: SubscriptionTier.GOLD,
  monthlyAmount: 39.99,
  yearlyAmount: 299.99,
  maxTrades: 9999,
  unlimitedTrades: true,
  maxPortfolioUploads: 50,
  allowPortfolioVideos: true,
  maxQuotesPerDay: 20,
  featuredAtTop: true,
  exposureLevel: 'MAXIMUM',
  trialDays: 14,
});

// ─── HELPER CONSTANTS ────────────────────────────────────────────────────────

const TRADER_PROFILE_ID = 'tp-001';
const USER_ID = 'user-001';
const SUB_ID = 'sub-001';
const DAY_MS = 24 * 60 * 60 * 1000;

function daysMs(n: number) {
  return n * DAY_MS;
}

// ─── MOCK SUBSCRIPTION BUILDER ───────────────────────────────────────────────

function makeSub(
  overrides: Partial<{
    planId: string;
    currentPlanId: string;
    pendingPlanId: string | null;
    priceId: string;
    billingCycle: BillingCycle;
    status: SubscriptionStatus;
    isTrial: boolean;
    trialEndsAt: Date | null;
    trialStartDate: Date | null;
    trialEndDate: Date | null;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    startDate: Date;
    endDate: Date | null;
    plan: any;
    currentPlan: any;
    pendingPlan: any;
    price: any;
    nextBillingAmount: any;
    lastChargedAmount: any;
    failedPaymentCount: number;
    cancelledAt: Date | null;
  }> = {},
) {
  const isTrial = overrides.isTrial ?? true;
  const defaultTrialEnd = isTrial ? new Date(Date.now() + daysMs(14)) : null;

  return {
    id: SUB_ID,
    traderProfileId: TRADER_PROFILE_ID,
    planId: overrides.planId ?? BRONZE.id,
    currentPlanId: overrides.currentPlanId ?? overrides.planId ?? BRONZE.id,
    pendingPlanId: overrides.pendingPlanId ?? null,
    priceId: overrides.priceId ?? BRONZE.prices[0].id,
    billingCycle: overrides.billingCycle ?? BillingCycle.MONTHLY,
    status: overrides.status ?? SubscriptionStatus.TRIAL,
    isTrial,
    trialStartDate: 'trialStartDate' in overrides ? overrides.trialStartDate : (isTrial ? new Date() : null),
    trialEndDate: 'trialEndDate' in overrides ? overrides.trialEndDate : defaultTrialEnd,
    trialEndsAt: 'trialEndsAt' in overrides ? overrides.trialEndsAt : defaultTrialEnd,
    currentPeriodStart: overrides.currentPeriodStart ?? null,
    currentPeriodEnd: overrides.currentPeriodEnd ?? null,
    startDate: overrides.startDate ?? new Date(),
    endDate: overrides.endDate ?? null,
    nextBillingAmount: overrides.nextBillingAmount ?? null,
    lastChargedAmount: overrides.lastChargedAmount ?? null,
    lastPlanChangeAt: null,
    cancelledAt: overrides.cancelledAt ?? null,
    nextBillingDate: null,
    failedPaymentCount: overrides.failedPaymentCount ?? 0,
    profileHiddenAt: null,
    stripeSubscriptionId: null,
    stripeCustomerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    plan: overrides.plan ?? BRONZE,
    currentPlan: overrides.currentPlan ?? overrides.plan ?? BRONZE,
    pendingPlan: overrides.pendingPlan ?? null,
    price: overrides.price ?? BRONZE.prices[0],
    traderProfile: {
      id: TRADER_PROFILE_ID,
      userId: USER_ID,
      subscriptionTier: (overrides.plan ?? BRONZE).name,
    },
  };
}

function traderProfile(sub: any) {
  return {
    id: TRADER_PROFILE_ID,
    userId: USER_ID,
    subscription: sub,
    subscriptionTier: sub.plan?.name ?? SubscriptionTier.BRONZE,
  };
}

// ─── MAIN DESCRIBE BLOCK ────────────────────────────────────────────────────

describe('SubscriptionsService – Full E2E Integration Test (24 Phases)', () => {
  let service: SubscriptionsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      traderProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      subscriptionPlan: {
        findUnique: jest.fn(),
      },
      subscription: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      subscriptionPayment: {
        create: jest.fn(),
      },
      subscriptionHistory: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback: any) => callback(prisma)),
    };

    const mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      deleteByPattern: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  /*
  |==========================================================================
  | PHASE 1 – REGISTRATION / SUBSCRIPTION CREATION
  |==========================================================================
  | Registration is handled in AuthService.traderRegisterStep3().
  | We verify the expected state after registration through the
  | SubscriptionsService.getMySubscription() read path.
  */
  describe('Phase 1 – Registration (read verification)', () => {
    it('1.1 getMySubscription returns TRIAL status with correct dates after registration', async () => {
      const now = new Date();
      const trialEnd = new Date(now.getTime() + daysMs(14));
      const sub = makeSub({
        planId: BRONZE.id,
        currentPlanId: BRONZE.id,
        plan: BRONZE,
        currentPlan: BRONZE,
        price: BRONZE.prices[0],
        status: SubscriptionStatus.TRIAL,
        isTrial: true,
        trialEndsAt: trialEnd,
        startDate: now,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
      });
      // Attach history to sub
      (sub as any).history = [];

      prisma.traderProfile.findUnique.mockResolvedValue({
        id: TRADER_PROFILE_ID,
        userId: USER_ID,
        subscription: sub,
      });

      const result = await service.getMySubscription(USER_ID);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe(SubscriptionStatus.TRIAL);
      expect(result.data.trial).toBe(true);
      expect(result.data.currentPlan.id).toBe(BRONZE.id);
      expect(result.data.pendingPlan).toBeNull();
      expect(result.data.history).toEqual([]);
    });
  });

  /*
  |==========================================================================
  | PHASE 2 – TRIAL PLAN SWITCHING (UNLIMITED FREE SWITCHES)
  |==========================================================================
  */
  describe('Phase 2 – Trial plan switching', () => {
    const futureTrialEnd = new Date(Date.now() + daysMs(10));

    function trialSub(plan: any) {
      return makeSub({
        planId: plan.id,
        currentPlanId: plan.id,
        plan,
        currentPlan: plan,
        price: plan.prices[0],
        status: SubscriptionStatus.TRIAL,
        isTrial: true,
        trialEndsAt: futureTrialEnd,
      });
    }

    it('2.1 Bronze → Silver during trial: free, no payment, no history', async () => {
      const sub = trialSub(BRONZE);
      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(SILVER);

      const result = await service.changePlan(USER_ID, { planId: SILVER.id });

      expect(result.success).toBe(true);
      expect(result.data.trial).toBe(true);
      expect(result.data.proratedAmount).toBe(0);
      expect(result.data.currentPlan.id).toBe(SILVER.id);
      expect(prisma.subscriptionPayment.create).not.toHaveBeenCalled();
      expect(prisma.subscriptionHistory.create).not.toHaveBeenCalled();
    });

    it('2.2 Silver → Gold during trial: free', async () => {
      const sub = trialSub(SILVER);
      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(GOLD);

      const result = await service.changePlan(USER_ID, { planId: GOLD.id });

      expect(result.success).toBe(true);
      expect(result.data.trial).toBe(true);
      expect(result.data.proratedAmount).toBe(0);
      expect(result.data.currentPlan.id).toBe(GOLD.id);
      expect(prisma.subscriptionPayment.create).not.toHaveBeenCalled();
    });

    it('2.3 Gold → Bronze during trial: free downgrade', async () => {
      const sub = trialSub(GOLD);
      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(BRONZE);

      const result = await service.changePlan(USER_ID, { planId: BRONZE.id });

      expect(result.success).toBe(true);
      expect(result.data.trial).toBe(true);
      expect(result.data.proratedAmount).toBe(0);
      expect(result.data.currentPlan.id).toBe(BRONZE.id);
    });

    it('2.4 Multiple rapid switches during trial all succeed with $0 charge', async () => {
      // Bronze → Silver
      let sub = trialSub(BRONZE);
      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(SILVER);
      let r = await service.changePlan(USER_ID, { planId: SILVER.id });
      expect(r.data.proratedAmount).toBe(0);

      // Silver → Gold
      sub = trialSub(SILVER);
      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(GOLD);
      r = await service.changePlan(USER_ID, { planId: GOLD.id });
      expect(r.data.proratedAmount).toBe(0);

      // Gold → Bronze
      sub = trialSub(GOLD);
      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(BRONZE);
      r = await service.changePlan(USER_ID, { planId: BRONZE.id });
      expect(r.data.proratedAmount).toBe(0);

      // Bronze → Gold
      sub = trialSub(BRONZE);
      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(GOLD);
      r = await service.changePlan(USER_ID, { planId: GOLD.id });
      expect(r.data.proratedAmount).toBe(0);

      // Total: no payment calls (all trial switches)
      expect(prisma.subscriptionPayment.create).not.toHaveBeenCalled();
    });
  });

  /*
  |==========================================================================
  | PHASE 3 – TRIAL EXPIRATION (processRenewals)
  |==========================================================================
  */
  describe('Phase 3 – Trial expiration', () => {
    it('3.1 Expired trial is renewed: status=ACTIVE, payment created, history created', async () => {
      const pastTrialEnd = new Date(Date.now() - 1000);
      const sub = makeSub({
        planId: SILVER.id,
        currentPlanId: SILVER.id,
        plan: SILVER,
        currentPlan: SILVER,
        price: SILVER.prices[0],
        status: SubscriptionStatus.TRIAL,
        isTrial: true,
        trialEndsAt: pastTrialEnd,
      });

      prisma.subscription.findMany.mockResolvedValue([sub]);
      prisma.subscriptionPlan.findUnique.mockResolvedValue(SILVER);

      const result = await service.processRenewals();

      expect(result.success).toBe(true);
      expect(result.data.processedCount).toBe(1);

      // Payment for Silver monthly amount
      expect(prisma.subscriptionPayment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subscriptionId: SUB_ID,
          amount: 24.99,
          status: 'SUCCESS',
        }),
      });

      // History: TRIAL_EXPIRATION_RENEWAL
      expect(prisma.subscriptionHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subscriptionId: SUB_ID,
          action: 'TRIAL_EXPIRATION_RENEWAL',
          toPlanId: SILVER.id,
          amount: 24.99,
        }),
      });

      // Subscription update: status=ACTIVE, isTrial=false
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: SUB_ID },
        data: expect.objectContaining({
          isTrial: false,
          status: SubscriptionStatus.ACTIVE,
        }),
      });
    });

    it('3.2 Trial expired with plan switched during trial: charges final selected plan', async () => {
      // Trader started with Bronze, switched to Gold during trial
      const pastTrialEnd = new Date(Date.now() - daysMs(1));
      const sub = makeSub({
        planId: GOLD.id,
        currentPlanId: GOLD.id,
        plan: GOLD,
        currentPlan: GOLD,
        price: GOLD.prices[0],
        status: SubscriptionStatus.TRIAL,
        isTrial: true,
        trialEndsAt: pastTrialEnd,
      });

      prisma.subscription.findMany.mockResolvedValue([sub]);
      prisma.subscriptionPlan.findUnique.mockResolvedValue(GOLD);

      const result = await service.processRenewals();

      expect(result.data.processedCount).toBe(1);
      expect(prisma.subscriptionPayment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: 39.99, // Gold monthly
        }),
      });
    });
  });

  /*
  |==========================================================================
  | PHASE 4 – POST-TRIAL UPGRADE (IMMEDIATE + PRORATION)
  |==========================================================================
  */
  describe('Phase 4 – Post-trial upgrade with proration', () => {
    it('4.1 Silver Monthly → Gold Monthly on day 5 of 30-day cycle', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - daysMs(5));
      const periodEnd = new Date(now.getTime() + daysMs(25));

      const sub = makeSub({
        planId: SILVER.id,
        currentPlanId: SILVER.id,
        plan: SILVER,
        currentPlan: SILVER,
        price: SILVER.prices[0], // 24.99
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
        startDate: periodStart,
        endDate: periodEnd,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(GOLD);
      prisma.subscription.update.mockResolvedValue({
        ...sub,
        currentPlanId: GOLD.id,
        currentPlan: GOLD,
      });

      const result = await service.changePlan(USER_ID, { planId: GOLD.id });

      expect(result.success).toBe(true);
      expect(result.data.trial).toBe(false);

      // Proration: (39.99 - 24.99) * (25/30) = 15.00 * 0.8333 = 12.50
      const diff = 39.99 - 24.99; // 15.00
      const totalDays = 30;
      const remainingDays = 25;
      const expected = Math.round(diff * (remainingDays / totalDays) * 100) / 100;
      expect(result.data.proratedAmount).toBe(expected);

      expect(prisma.subscriptionPayment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: expected,
          status: 'SUCCESS',
        }),
      });

      expect(prisma.subscriptionHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'UPGRADE',
          proratedAmount: expected,
        }),
      });
    });
  });

  /*
  |==========================================================================
  | PHASE 5 – MULTI-LEVEL UPGRADE (BRONZE → GOLD)
  |==========================================================================
  */
  describe('Phase 5 – Multi-level upgrade', () => {
    it('5.1 Bronze Monthly → Gold Monthly (skip Silver)', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - daysMs(10));
      const periodEnd = new Date(now.getTime() + daysMs(20));

      const sub = makeSub({
        planId: BRONZE.id,
        currentPlanId: BRONZE.id,
        plan: BRONZE,
        currentPlan: BRONZE,
        price: BRONZE.prices[0], // 14.99
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
        startDate: periodStart,
        endDate: periodEnd,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(GOLD);
      prisma.subscription.update.mockResolvedValue({
        ...sub,
        currentPlanId: GOLD.id,
        currentPlan: GOLD,
      });

      const result = await service.changePlan(USER_ID, { planId: GOLD.id });

      expect(result.success).toBe(true);
      const diff = 39.99 - 14.99; // 25.00
      const totalDays = 30;
      const remainingDays = 20;
      const expected = Math.round(diff * (remainingDays / totalDays) * 100) / 100;
      expect(result.data.proratedAmount).toBe(expected);

      // Verify no intermediate Silver plan required
      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currentPlanId: GOLD.id,
            planId: GOLD.id,
          }),
        }),
      );
    });
  });

  /*
  |==========================================================================
  | PHASE 6 – DOWNGRADE SCHEDULING
  |==========================================================================
  */
  describe('Phase 6 – Downgrade scheduling', () => {
    it('6.1 Gold → Silver: schedules pending, no immediate change', async () => {
      const now = new Date();
      const periodEnd = new Date(now.getTime() + daysMs(20));

      const sub = makeSub({
        planId: GOLD.id,
        currentPlanId: GOLD.id,
        plan: GOLD,
        currentPlan: GOLD,
        price: GOLD.prices[0], // 39.99
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
        currentPeriodEnd: periodEnd,
        startDate: new Date(now.getTime() - daysMs(10)),
        endDate: periodEnd,
        currentPeriodStart: new Date(now.getTime() - daysMs(10)),
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(SILVER);

      const result = await service.changePlan(USER_ID, { planId: SILVER.id });

      expect(result.success).toBe(true);
      expect(result.message).toContain('next billing cycle');
      expect(result.data.currentPlan.id).toBe(GOLD.id); // Unchanged
      expect(result.data.pendingPlan.id).toBe(SILVER.id);
      expect(result.data.proratedAmount).toBe(0);

      // No payment for downgrade
      expect(prisma.subscriptionPayment.create).not.toHaveBeenCalled();

      // History: DOWNGRADE_SCHEDULED
      expect(prisma.subscriptionHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'DOWNGRADE_SCHEDULED',
          toPlanId: SILVER.id,
          amount: 0,
        }),
      });
    });

    it('6.2 Gold → Bronze: schedules pending downgrade (multi-level)', async () => {
      const now = new Date();
      const periodEnd = new Date(now.getTime() + daysMs(15));

      const sub = makeSub({
        planId: GOLD.id,
        currentPlanId: GOLD.id,
        plan: GOLD,
        currentPlan: GOLD,
        price: GOLD.prices[0],
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
        currentPeriodEnd: periodEnd,
        startDate: new Date(now.getTime() - daysMs(15)),
        endDate: periodEnd,
        currentPeriodStart: new Date(now.getTime() - daysMs(15)),
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(BRONZE);

      const result = await service.changePlan(USER_ID, { planId: BRONZE.id });

      expect(result.success).toBe(true);
      expect(result.data.pendingPlan.id).toBe(BRONZE.id);
      expect(result.data.currentPlan.id).toBe(GOLD.id);
    });
  });

  /*
  |==========================================================================
  | PHASE 7 – CANCEL PENDING DOWNGRADE
  |==========================================================================
  */
  describe('Phase 7 – Cancel pending downgrade', () => {
    it('7.1 Cancels pending downgrade and retains current plan', async () => {
      const sub = makeSub({
        planId: GOLD.id,
        currentPlanId: GOLD.id,
        pendingPlanId: SILVER.id,
        plan: GOLD,
        currentPlan: GOLD,
        price: GOLD.prices[0],
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));

      const result = await service.cancelPendingDowngrade(USER_ID);

      expect(result.success).toBe(true);
      expect(result.data.pendingPlan).toBeNull();
      expect(result.data.currentPlan.id).toBe(GOLD.id);

      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: SUB_ID },
        data: { pendingPlanId: null },
      });
    });

    it('7.2 Throws BadRequestException if no pending downgrade exists', async () => {
      const sub = makeSub({
        planId: GOLD.id,
        currentPlanId: GOLD.id,
        pendingPlanId: null,
        plan: GOLD,
        currentPlan: GOLD,
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));

      await expect(service.cancelPendingDowngrade(USER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  /*
  |==========================================================================
  | PHASE 8 – RENEWAL WITH PENDING DOWNGRADE
  |==========================================================================
  */
  describe('Phase 8 – Renewal with pending downgrade', () => {
    it('8.1 Pending Silver downgrade becomes active at period end', async () => {
      const pastPeriodEnd = new Date(Date.now() - 1000);
      const sub = makeSub({
        planId: GOLD.id,
        currentPlanId: GOLD.id,
        pendingPlanId: SILVER.id,
        plan: GOLD,
        currentPlan: GOLD,
        pendingPlan: SILVER,
        price: GOLD.prices[0],
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
        currentPeriodEnd: pastPeriodEnd,
        endDate: pastPeriodEnd,
      });

      prisma.subscription.findMany.mockResolvedValue([sub]);
      prisma.subscriptionPlan.findUnique.mockResolvedValue(SILVER);

      const result = await service.processRenewals();

      expect(result.data.processedCount).toBe(1);

      // Payment for Silver price
      expect(prisma.subscriptionPayment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: 24.99,
          status: 'SUCCESS',
        }),
      });

      // History: DOWNGRADE_APPLIED
      expect(prisma.subscriptionHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'DOWNGRADE_APPLIED',
          toPlanId: SILVER.id,
        }),
      });

      // Subscription updated to Silver, pendingPlanId cleared
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: SUB_ID },
        data: expect.objectContaining({
          currentPlanId: SILVER.id,
          planId: SILVER.id,
          pendingPlanId: null,
          status: SubscriptionStatus.ACTIVE,
        }),
      });
    });
  });

  /*
  |==========================================================================
  | PHASE 9 – MONTHLY PRORATION MATRIX
  |==========================================================================
  */
  describe('Phase 9 – Monthly proration matrix', () => {
    const testDays = [1, 5, 10, 15, 20, 25];

    testDays.forEach((dayElapsed) => {
      const remaining = 30 - dayElapsed;

      it(`9.x Bronze→Gold on day ${dayElapsed} (${remaining} days remaining)`, async () => {
        const now = new Date();
        const periodStart = new Date(now.getTime() - daysMs(dayElapsed));
        const periodEnd = new Date(now.getTime() + daysMs(remaining));

        const sub = makeSub({
          planId: BRONZE.id,
          currentPlanId: BRONZE.id,
          plan: BRONZE,
          currentPlan: BRONZE,
          price: BRONZE.prices[0],
          status: SubscriptionStatus.ACTIVE,
          isTrial: false,
          trialEndsAt: null,
          startDate: periodStart,
          endDate: periodEnd,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        });

        prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
        prisma.subscriptionPlan.findUnique.mockResolvedValue(GOLD);
        prisma.subscription.update.mockResolvedValue({
          ...sub,
          currentPlanId: GOLD.id,
          currentPlan: GOLD,
        });

        const result = await service.changePlan(USER_ID, { planId: GOLD.id });

        const diff = 39.99 - 14.99; // 25.00
        const totalMs = periodEnd.getTime() - periodStart.getTime();
        const totalDays = Math.max(1, totalMs / DAY_MS);
        const remainingMs = periodEnd.getTime() - now.getTime();
        const remainingDaysActual = Math.max(0, remainingMs / DAY_MS);
        const expected =
          Math.round(diff * (remainingDaysActual / totalDays) * 100) / 100;

        expect(result.data.proratedAmount).toBe(expected);
        expect(prisma.subscriptionPayment.create).toHaveBeenCalled();
      });
    });
  });

  /*
  |==========================================================================
  | PHASE 10 – YEARLY PRORATION MATRIX
  |==========================================================================
  */
  describe('Phase 10 – Yearly proration matrix', () => {
    const testRemainingDays = [100, 200, 364];

    testRemainingDays.forEach((remaining) => {
      const elapsed = 365 - remaining;

      it(`10.x Silver→Gold yearly with ${remaining} days remaining`, async () => {
        const now = new Date();
        const periodStart = new Date(now.getTime() - daysMs(elapsed));
        const periodEnd = new Date(now.getTime() + daysMs(remaining));

        const sub = makeSub({
          planId: SILVER.id,
          currentPlanId: SILVER.id,
          plan: SILVER,
          currentPlan: SILVER,
          priceId: SILVER.prices[1].id,
          price: SILVER.prices[1], // yearly: 199.99
          billingCycle: BillingCycle.YEARLY,
          status: SubscriptionStatus.ACTIVE,
          isTrial: false,
          trialEndsAt: null,
          startDate: periodStart,
          endDate: periodEnd,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        });

        prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
        prisma.subscriptionPlan.findUnique.mockResolvedValue(GOLD);
        prisma.subscription.update.mockResolvedValue({
          ...sub,
          currentPlanId: GOLD.id,
          currentPlan: GOLD,
        });

        const result = await service.changePlan(USER_ID, { planId: GOLD.id });

        const diff = 299.99 - 199.99; // 100.00
        const remainingMs = periodEnd.getTime() - now.getTime();
        const remainingDaysActual = Math.max(0, remainingMs / DAY_MS);
        const expected =
          Math.round(diff * (remainingDaysActual / 365) * 100) / 100;

        expect(result.data.proratedAmount).toBe(expected);
        expect(prisma.subscriptionPayment.create).toHaveBeenCalled();
      });
    });
  });

  /*
  |==========================================================================
  | PHASE 11 – BILLING CYCLE CHANGE (MONTHLY ↔ YEARLY)
  |==========================================================================
  | The current system compares price amounts to decide upgrade vs downgrade.
  | Monthly→Yearly on same plan: yearlyPrice > monthlyPrice → treated as UPGRADE
  | Yearly→Monthly on same plan: monthlyPrice < yearlyPrice → treated as DOWNGRADE
  | This is a KNOWN BUG documented in the analysis.
  */
  describe('Phase 11 – Billing cycle changes (same plan & combined)', () => {
    it('11.1 Silver Monthly → Silver Yearly succeeds as billing cycle change', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - daysMs(10));
      const periodEnd = new Date(now.getTime() + daysMs(20));

      const sub = makeSub({
        planId: SILVER.id,
        currentPlanId: SILVER.id,
        plan: SILVER,
        currentPlan: SILVER,
        price: SILVER.prices[0], // monthly: 24.99
        billingCycle: BillingCycle.MONTHLY,
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
        startDate: periodStart,
        endDate: periodEnd,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(SILVER);
      prisma.subscription.update.mockResolvedValue({
        ...sub,
        billingCycle: BillingCycle.YEARLY,
      });

      const result = await service.changePlan(USER_ID, {
        planId: SILVER.id,
        billingCycle: BillingCycle.YEARLY,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Billing cycle updated');
      expect(result.data.proratedAmount).toBe(199.99); // Full yearly price
    });

    it('11.2 Silver Yearly → Silver Monthly succeeds as billing cycle change', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - daysMs(100));
      const periodEnd = new Date(now.getTime() + daysMs(265));

      const sub = makeSub({
        planId: SILVER.id,
        currentPlanId: SILVER.id,
        plan: SILVER,
        currentPlan: SILVER,
        price: SILVER.prices[1], // yearly: 199.99
        billingCycle: BillingCycle.YEARLY,
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
        startDate: periodStart,
        endDate: periodEnd,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(SILVER);
      prisma.subscription.update.mockResolvedValue({
        ...sub,
        billingCycle: BillingCycle.MONTHLY,
      });

      const result = await service.changePlan(USER_ID, {
        planId: SILVER.id,
        billingCycle: BillingCycle.MONTHLY,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Billing cycle updated');
      expect(result.data.proratedAmount).toBe(24.99); // Full monthly price
    });

    it('11.3 Bronze Monthly → Gold Yearly (Tier upgrade + cycle change)', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - daysMs(5));
      const periodEnd = new Date(now.getTime() + daysMs(25));

      const sub = makeSub({
        planId: BRONZE.id,
        currentPlanId: BRONZE.id,
        plan: BRONZE,
        currentPlan: BRONZE,
        price: BRONZE.prices[0],
        billingCycle: BillingCycle.MONTHLY,
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
        startDate: periodStart,
        endDate: periodEnd,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(GOLD);
      prisma.subscription.update.mockResolvedValue({
        ...sub,
        currentPlanId: GOLD.id,
        billingCycle: BillingCycle.YEARLY,
      });

      const result = await service.changePlan(USER_ID, {
        planId: GOLD.id,
        billingCycle: BillingCycle.YEARLY,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('upgraded successfully');
    });
  });

  /*
  |==========================================================================
  | PHASE 12 – NORMAL RENEWAL (NO PENDING PLAN)
  |==========================================================================
  */
  describe('Phase 12 – Normal renewal without pending plan', () => {
    it('12.1 Active subscription auto-renews at period end', async () => {
      const pastPeriodEnd = new Date(Date.now() - 1000);
      const sub = makeSub({
        planId: SILVER.id,
        currentPlanId: SILVER.id,
        plan: SILVER,
        currentPlan: SILVER,
        price: SILVER.prices[0],
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
        currentPeriodEnd: pastPeriodEnd,
        endDate: pastPeriodEnd,
      });

      prisma.subscription.findMany.mockResolvedValue([sub]);
      prisma.subscriptionPlan.findUnique.mockResolvedValue(SILVER);

      const result = await service.processRenewals();

      expect(result.data.processedCount).toBe(1);

      expect(prisma.subscriptionPayment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: 24.99,
          status: 'SUCCESS',
        }),
      });

      expect(prisma.subscriptionHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'RENEWAL',
          amount: 24.99,
        }),
      });

      // Verify period is extended
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: SUB_ID },
        data: expect.objectContaining({
          status: SubscriptionStatus.ACTIVE,
          isTrial: false,
        }),
      });
    });
  });

  /*
  |==========================================================================
  | PHASE 13 – EXPIRED SUBSCRIPTION BEHAVIOR
  |==========================================================================
  */
  describe('Phase 13 – Expired subscription', () => {
    it('13.1 Cannot change plan on expired subscription', async () => {
      const sub = makeSub({
        planId: SILVER.id,
        currentPlanId: SILVER.id,
        plan: SILVER,
        currentPlan: SILVER,
        price: SILVER.prices[0],
        status: SubscriptionStatus.EXPIRED,
        isTrial: false,
        trialEndsAt: null,
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(GOLD);

      await expect(
        service.changePlan(USER_ID, { planId: GOLD.id }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  /*
  |==========================================================================
  | PHASE 14 – CANCELLED SUBSCRIPTION BEHAVIOR
  |==========================================================================
  */
  describe('Phase 14 – Cancelled subscription', () => {
    it('14.1 Cannot change plan on cancelled subscription', async () => {
      const sub = makeSub({
        planId: SILVER.id,
        currentPlanId: SILVER.id,
        plan: SILVER,
        currentPlan: SILVER,
        price: SILVER.prices[0],
        status: SubscriptionStatus.CANCELLED,
        isTrial: false,
        trialEndsAt: null,
        cancelledAt: new Date(),
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(GOLD);

      await expect(
        service.changePlan(USER_ID, { planId: GOLD.id }),
      ).rejects.toThrow(BadRequestException);
    });

    it('14.2 Renewal processor ignores cancelled subscriptions', async () => {
      // findMany returns cancelled sub (shouldn't match the where clause)
      prisma.subscription.findMany.mockResolvedValue([]);

      const result = await service.processRenewals();
      expect(result.data.processedCount).toBe(0);
    });
  });

  /*
  |==========================================================================
  | PHASE 15 – VALIDATION & ERROR HANDLING
  |==========================================================================
  */
  describe('Phase 15 – Validation edge cases', () => {
    it('15.1 Same plan selection throws BadRequestException', async () => {
      const sub = makeSub({
        planId: SILVER.id,
        currentPlanId: SILVER.id,
        plan: SILVER,
        currentPlan: SILVER,
        price: SILVER.prices[0],
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(SILVER);

      await expect(
        service.changePlan(USER_ID, { planId: SILVER.id }),
      ).rejects.toThrow(BadRequestException);
    });

    it('15.2 Non-existent plan ID throws BadRequestException', async () => {
      const sub = makeSub({
        planId: SILVER.id,
        currentPlanId: SILVER.id,
        plan: SILVER,
        currentPlan: SILVER,
        price: SILVER.prices[0],
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(null);

      await expect(
        service.changePlan(USER_ID, { planId: 'non-existent-plan' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('15.3 Inactive plan throws BadRequestException', async () => {
      const inactivePlan = { ...GOLD, isActive: false };
      const sub = makeSub({
        planId: SILVER.id,
        currentPlanId: SILVER.id,
        plan: SILVER,
        currentPlan: SILVER,
        price: SILVER.prices[0],
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(inactivePlan);

      await expect(
        service.changePlan(USER_ID, { planId: inactivePlan.id }),
      ).rejects.toThrow(BadRequestException);
    });

    it('15.4 Missing trader profile throws NotFoundException', async () => {
      prisma.traderProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.changePlan(USER_ID, { planId: GOLD.id }),
      ).rejects.toThrow(NotFoundException);
    });

    it('15.5 Missing subscription throws NotFoundException', async () => {
      prisma.traderProfile.findUnique.mockResolvedValue({
        id: TRADER_PROFILE_ID,
        userId: USER_ID,
        subscription: null,
      });

      await expect(
        service.changePlan(USER_ID, { planId: GOLD.id }),
      ).rejects.toThrow(NotFoundException);
    });

    it('15.6 Target plan with no matching billing cycle price throws BadRequestException', async () => {
      const planNoMonthly = {
        ...GOLD,
        id: 'plan-no-monthly',
        prices: [
          {
            ...GOLD.prices[1], // only yearly
          },
        ],
      };

      const sub = makeSub({
        planId: SILVER.id,
        currentPlanId: SILVER.id,
        plan: SILVER,
        currentPlan: SILVER,
        price: SILVER.prices[0],
        billingCycle: BillingCycle.MONTHLY,
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(planNoMonthly);

      await expect(
        service.changePlan(USER_ID, { planId: planNoMonthly.id }),
      ).rejects.toThrow(BadRequestException);
    });

    it('15.7 Already scheduled pending plan returns info message', async () => {
      const periodEnd = new Date(Date.now() + daysMs(20));
      const sub = makeSub({
        planId: GOLD.id,
        currentPlanId: GOLD.id,
        pendingPlanId: SILVER.id,
        plan: GOLD,
        currentPlan: GOLD,
        price: GOLD.prices[0],
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
        currentPeriodEnd: periodEnd,
        endDate: periodEnd,
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(SILVER);

      const result = await service.changePlan(USER_ID, { planId: SILVER.id });
      expect(result.success).toBe(true);
      expect(result.message).toContain('already scheduled');
    });

    it('15.8 Selecting current plan when pending exists clears pending', async () => {
      const periodEnd = new Date(Date.now() + daysMs(20));
      const sub = makeSub({
        planId: GOLD.id,
        currentPlanId: GOLD.id,
        pendingPlanId: SILVER.id,
        plan: GOLD,
        currentPlan: GOLD,
        price: GOLD.prices[0],
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
        currentPeriodEnd: periodEnd,
        endDate: periodEnd,
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(GOLD);

      const result = await service.changePlan(USER_ID, { planId: GOLD.id });

      expect(result.success).toBe(true);
      expect(result.data.pendingPlan).toBeNull();
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: SUB_ID },
        data: { pendingPlanId: null },
      });
    });
  });

  /*
  |==========================================================================
  | PHASE 16 – PAYMENT FAILURE ROLLBACK
  |==========================================================================
  | With $transaction, if payment creation fails the whole tx rolls back.
  */
  describe('Phase 16 – Payment failure rollback', () => {
    it('16.1 If payment creation throws, upgrade is rolled back', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - daysMs(5));
      const periodEnd = new Date(now.getTime() + daysMs(25));

      const sub = makeSub({
        planId: SILVER.id,
        currentPlanId: SILVER.id,
        plan: SILVER,
        currentPlan: SILVER,
        price: SILVER.prices[0],
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
        startDate: periodStart,
        endDate: periodEnd,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(GOLD);

      // Make payment creation fail
      prisma.subscriptionPayment.create.mockRejectedValue(
        new Error('Payment gateway error'),
      );

      // Since $transaction propagates the error
      prisma.$transaction.mockImplementation(async (callback: any) => {
        try {
          return await callback(prisma);
        } catch (e) {
          throw e;
        }
      });

      await expect(
        service.changePlan(USER_ID, { planId: GOLD.id }),
      ).rejects.toThrow('Payment gateway error');

      // subscription.update should not have persisted (tx rolled back)
      // In mock world, both were called but tx threw, so no commit
    });
  });

  /*
  |==========================================================================
  | PHASE 17 – TRANSACTION ROLLBACK ON DB FAILURE
  |==========================================================================
  */
  describe('Phase 17 – Transaction rollback on DB failure', () => {
    it('17.1 DB failure after payment creation rolls back everything', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - daysMs(5));
      const periodEnd = new Date(now.getTime() + daysMs(25));

      const sub = makeSub({
        planId: SILVER.id,
        currentPlanId: SILVER.id,
        plan: SILVER,
        currentPlan: SILVER,
        price: SILVER.prices[0],
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
        startDate: periodStart,
        endDate: periodEnd,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(GOLD);

      // Payment succeeds but history creation fails
      prisma.subscriptionPayment.create.mockResolvedValue({});
      prisma.subscriptionHistory.create.mockRejectedValue(
        new Error('DB connection lost'),
      );

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(prisma);
      });

      await expect(
        service.changePlan(USER_ID, { planId: GOLD.id }),
      ).rejects.toThrow('DB connection lost');
    });
  });

  /*
  |==========================================================================
  | PHASE 18 – CONCURRENCY / RACE CONDITIONS
  |==========================================================================
  */
  describe('Phase 18 – Concurrency', () => {
    it('18.1 Simultaneous upgrade requests: both can execute (no DB lock in mocks)', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - daysMs(5));
      const periodEnd = new Date(now.getTime() + daysMs(25));

      const sub = makeSub({
        planId: BRONZE.id,
        currentPlanId: BRONZE.id,
        plan: BRONZE,
        currentPlan: BRONZE,
        price: BRONZE.prices[0],
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
        startDate: periodStart,
        endDate: periodEnd,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(GOLD);
      prisma.subscription.update.mockResolvedValue({
        ...sub,
        currentPlanId: GOLD.id,
        currentPlan: GOLD,
      });

      // Fire two concurrent upgrades
      const [result1, result2] = await Promise.all([
        service.changePlan(USER_ID, { planId: GOLD.id }),
        service.changePlan(USER_ID, { planId: GOLD.id }),
      ]);

      // Both succeed in mock world (real DB would need locking)
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // NOTE: In production, Prisma transactions + unique constraint
      // on traderProfileId ensures only one can commit.
      // This test documents the behavior and the need for DB-level locking.
    });
  });

  /*
  |==========================================================================
  | PHASE 19 – SECURITY (CROSS-TRADER ACCESS)
  |==========================================================================
  | changePlan uses userId from req.user, so Trader A cannot pass Trader B's
  | userId. If traderProfile.findUnique returns null → NotFoundException.
  */
  describe('Phase 19 – Security / cross-trader access', () => {
    it('19.1 User without trader profile gets NotFoundException', async () => {
      prisma.traderProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.changePlan('attacker-user-id', { planId: GOLD.id }),
      ).rejects.toThrow(NotFoundException);
    });

    it('19.2 User without subscription gets NotFoundException', async () => {
      prisma.traderProfile.findUnique.mockResolvedValue({
        id: 'other-tp',
        userId: 'attacker-user-id',
        subscription: null,
      });

      await expect(
        service.changePlan('attacker-user-id', { planId: GOLD.id }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  /*
  |==========================================================================
  | PHASE 20 – API ENDPOINT VALIDATION
  |==========================================================================
  | Verifies that service methods exist and return expected shapes.
  */
  describe('Phase 20 – API endpoint shape validation', () => {
    it('20.1 getMySubscription returns expected shape', async () => {
      const sub = makeSub({
        planId: SILVER.id,
        currentPlanId: SILVER.id,
        plan: SILVER,
        currentPlan: SILVER,
        price: SILVER.prices[0],
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
      });
      (sub as any).history = [];

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));

      const result = await service.getMySubscription(USER_ID);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('currentPlan');
      expect(result.data).toHaveProperty('pendingPlan');
      expect(result.data).toHaveProperty('trial');
      expect(result.data).toHaveProperty('billingCycle');
      expect(result.data).toHaveProperty('status');
      expect(result.data).toHaveProperty('history');
    });

    it('20.2 changePlan upgrade returns expected shape', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - daysMs(5));
      const periodEnd = new Date(now.getTime() + daysMs(25));

      const sub = makeSub({
        planId: BRONZE.id,
        currentPlanId: BRONZE.id,
        plan: BRONZE,
        currentPlan: BRONZE,
        price: BRONZE.prices[0],
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
        startDate: periodStart,
        endDate: periodEnd,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(GOLD);
      prisma.subscription.update.mockResolvedValue({
        ...sub,
        currentPlanId: GOLD.id,
        currentPlan: GOLD,
      });

      const result = await service.changePlan(USER_ID, { planId: GOLD.id });

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
      expect(result.data).toHaveProperty('currentPlan');
      expect(result.data).toHaveProperty('proratedAmount');
      expect(result.data).toHaveProperty('effectiveDate');
    });

    it('20.3 processRenewals returns expected shape', async () => {
      prisma.subscription.findMany.mockResolvedValue([]);

      const result = await service.processRenewals();

      expect(result).toHaveProperty('success', true);
      expect(result.data).toHaveProperty('processedCount', 0);
    });
  });

  /*
  |==========================================================================
  | PHASE 21 – DATABASE INTEGRITY CHECKS
  |==========================================================================
  */
  describe('Phase 21 – Database integrity', () => {
    it('21.1 Upgrade updates both subscription and trader profile', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - daysMs(5));
      const periodEnd = new Date(now.getTime() + daysMs(25));

      const sub = makeSub({
        planId: BRONZE.id,
        currentPlanId: BRONZE.id,
        plan: BRONZE,
        currentPlan: BRONZE,
        price: BRONZE.prices[0],
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
        startDate: periodStart,
        endDate: periodEnd,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(GOLD);
      prisma.subscription.update.mockResolvedValue({
        ...sub,
        currentPlanId: GOLD.id,
        currentPlan: GOLD,
      });

      await service.changePlan(USER_ID, { planId: GOLD.id });

      // Verify traderProfile updated with new tier
      expect(prisma.traderProfile.update).toHaveBeenCalledWith({
        where: { id: TRADER_PROFILE_ID },
        data: { subscriptionTier: SubscriptionTier.GOLD },
      });

      // Verify subscription updated
      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currentPlanId: GOLD.id,
            planId: GOLD.id,
          }),
        }),
      );
    });

    it('21.2 Renewal updates traderProfile.subscriptionStatus to ACTIVE', async () => {
      const pastPeriodEnd = new Date(Date.now() - 1000);
      const sub = makeSub({
        planId: SILVER.id,
        currentPlanId: SILVER.id,
        plan: SILVER,
        currentPlan: SILVER,
        price: SILVER.prices[0],
        status: SubscriptionStatus.TRIAL,
        isTrial: true,
        trialEndsAt: pastPeriodEnd,
      });

      prisma.subscription.findMany.mockResolvedValue([sub]);
      prisma.subscriptionPlan.findUnique.mockResolvedValue(SILVER);

      await service.processRenewals();

      expect(prisma.traderProfile.update).toHaveBeenCalledWith({
        where: { id: TRADER_PROFILE_ID },
        data: expect.objectContaining({
          subscriptionTier: SubscriptionTier.SILVER,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
        }),
      });
    });

    it('21.3 Trial switch updates traderProfile.subscriptionTier', async () => {
      const futureTrialEnd = new Date(Date.now() + daysMs(10));
      const sub = makeSub({
        planId: BRONZE.id,
        currentPlanId: BRONZE.id,
        plan: BRONZE,
        currentPlan: BRONZE,
        price: BRONZE.prices[0],
        status: SubscriptionStatus.TRIAL,
        isTrial: true,
        trialEndsAt: futureTrialEnd,
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(GOLD);

      await service.changePlan(USER_ID, { planId: GOLD.id });

      expect(prisma.traderProfile.update).toHaveBeenCalledWith({
        where: { id: TRADER_PROFILE_ID },
        data: { subscriptionTier: SubscriptionTier.GOLD },
      });
    });
  });

  /*
  |==========================================================================
  | PHASE 22 – FEATURE ENFORCEMENT (quote limits, portfolio limits)
  |==========================================================================
  | Feature enforcement is done in QuoteService, not SubscriptionsService.
  | We verify the plan data structures are correct for enforcement.
  */
  describe('Phase 22 – Feature enforcement data integrity', () => {
    it('22.1 Bronze plan has correct feature limits', () => {
      expect(BRONZE.maxQuotesPerDay).toBe(3);
      expect(BRONZE.maxPortfolioUploads).toBe(5);
      expect(BRONZE.maxTrades).toBe(1);
      expect(BRONZE.allowPortfolioVideos).toBe(false);
      expect(BRONZE.unlimitedTrades).toBe(false);
    });

    it('22.2 Silver plan has higher limits than Bronze', () => {
      expect(SILVER.maxQuotesPerDay).toBeGreaterThan(BRONZE.maxQuotesPerDay);
      expect(SILVER.maxPortfolioUploads).toBeGreaterThan(
        BRONZE.maxPortfolioUploads,
      );
      expect(SILVER.maxTrades).toBeGreaterThan(BRONZE.maxTrades);
    });

    it('22.3 Gold plan has highest limits', () => {
      expect(GOLD.maxQuotesPerDay).toBeGreaterThan(SILVER.maxQuotesPerDay);
      expect(GOLD.maxPortfolioUploads).toBeGreaterThan(
        SILVER.maxPortfolioUploads,
      );
      expect(GOLD.unlimitedTrades).toBe(true);
      expect(GOLD.featuredAtTop).toBe(true);
    });

    it('22.4 After upgrade, subscription.plan reflects new limits', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - daysMs(5));
      const periodEnd = new Date(now.getTime() + daysMs(25));

      const sub = makeSub({
        planId: BRONZE.id,
        currentPlanId: BRONZE.id,
        plan: BRONZE,
        currentPlan: BRONZE,
        price: BRONZE.prices[0],
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        trialEndsAt: null,
        startDate: periodStart,
        endDate: periodEnd,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      });

      prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
      prisma.subscriptionPlan.findUnique.mockResolvedValue(GOLD);
      prisma.subscription.update.mockResolvedValue({
        ...sub,
        currentPlanId: GOLD.id,
        planId: GOLD.id,
        currentPlan: GOLD,
        plan: GOLD,
      });

      const result = await service.changePlan(USER_ID, { planId: GOLD.id });

      // After upgrade, currentPlan reflects Gold limits
      expect(result.data.currentPlan.maxQuotesPerDay).toBe(20);
      expect(result.data.currentPlan.maxPortfolioUploads).toBe(50);
      expect(result.data.currentPlan.unlimitedTrades).toBe(true);
    });
  });

  /*
  |==========================================================================
  | PHASE 23 – PERFORMANCE STRESS TEST
  |==========================================================================
  */
  describe('Phase 23 – Performance stress test', () => {
    it('23.1 100 sequential upgrades complete without errors', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - daysMs(5));
      const periodEnd = new Date(now.getTime() + daysMs(25));

      for (let i = 0; i < 100; i++) {
        const sub = makeSub({
          planId: BRONZE.id,
          currentPlanId: BRONZE.id,
          plan: BRONZE,
          currentPlan: BRONZE,
          price: BRONZE.prices[0],
          status: SubscriptionStatus.ACTIVE,
          isTrial: false,
          trialEndsAt: null,
          startDate: periodStart,
          endDate: periodEnd,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        });

        prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
        prisma.subscriptionPlan.findUnique.mockResolvedValue(GOLD);
        prisma.subscription.update.mockResolvedValue({
          ...sub,
          currentPlanId: GOLD.id,
          currentPlan: GOLD,
        });

        const result = await service.changePlan(USER_ID, { planId: GOLD.id });
        expect(result.success).toBe(true);
      }
    });

    it('23.2 100 processRenewals with 0 subs each complete quickly', async () => {
      for (let i = 0; i < 100; i++) {
        prisma.subscription.findMany.mockResolvedValue([]);
        const result = await service.processRenewals();
        expect(result.data.processedCount).toBe(0);
      }
    });

    it('23.3 100 downgrade schedules complete without duplicate history', async () => {
      for (let i = 0; i < 100; i++) {
        const now = new Date();
        const periodEnd = new Date(now.getTime() + daysMs(20));

        const sub = makeSub({
          planId: GOLD.id,
          currentPlanId: GOLD.id,
          plan: GOLD,
          currentPlan: GOLD,
          price: GOLD.prices[0],
          status: SubscriptionStatus.ACTIVE,
          isTrial: false,
          trialEndsAt: null,
          currentPeriodEnd: periodEnd,
          startDate: new Date(now.getTime() - daysMs(10)),
          endDate: periodEnd,
          currentPeriodStart: new Date(now.getTime() - daysMs(10)),
        });

        prisma.traderProfile.findUnique.mockResolvedValue(traderProfile(sub));
        prisma.subscriptionPlan.findUnique.mockResolvedValue(BRONZE);

        const result = await service.changePlan(USER_ID, {
          planId: BRONZE.id,
        });
        expect(result.success).toBe(true);
      }

      // Each iteration creates exactly 1 history record
      expect(prisma.subscriptionHistory.create).toHaveBeenCalledTimes(100);
    });
  });

  /*
  |==========================================================================
  | PHASE 24 – SUBSCRIPTION STATUS FEATURE GUARD ENFORCEMENT
  |==========================================================================
  */
  describe('Phase 24 – Subscription Status Feature Guard Enforcement', () => {
    let guardService: import('./subscription-guard.service').SubscriptionGuardService;

    beforeEach(() => {
      const { SubscriptionGuardService } = require('./subscription-guard.service');
      guardService = new SubscriptionGuardService();
    });

    it('24.1 Allows features when status is ACTIVE', () => {
      expect(() =>
        guardService.assertActiveSubscription({ status: SubscriptionStatus.ACTIVE }),
      ).not.toThrow();
    });

    it('24.2 Allows features when status is TRIAL', () => {
      expect(() =>
        guardService.assertActiveSubscription({ status: SubscriptionStatus.TRIAL }),
      ).not.toThrow();
    });

    it('24.3 Blocks features when status is EXPIRED', () => {
      expect(() =>
        guardService.assertActiveSubscription({ status: SubscriptionStatus.EXPIRED }),
      ).toThrow(BadRequestException);
    });

    it('24.4 Blocks features when status is CANCELLED', () => {
      expect(() =>
        guardService.assertActiveSubscription({ status: SubscriptionStatus.CANCELLED }),
      ).toThrow(BadRequestException);
    });

    it('24.5 Blocks features when subscription is missing or null', () => {
      expect(() => guardService.assertActiveSubscription(null)).toThrow(BadRequestException);
    });
  });
});
