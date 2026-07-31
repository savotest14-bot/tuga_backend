import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BillingCycle, SubscriptionStatus, SubscriptionTier } from '@prisma/client';

describe('SubscriptionsService - Complete Scenario Testing', () => {
  let service: SubscriptionsService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockTraderProfileId = 'trader-profile-123';
  const mockUserId = 'user-123';
  const mockSubId = 'sub-123';

  const mockBronzePlan = {
    id: 'plan-bronze',
    name: SubscriptionTier.BRONZE,
    description: 'Bronze Plan',
    maxTrades: 5,
    unlimitedTrades: false,
    maxPortfolioUploads: 5,
    allowPortfolioVideos: false,
    maxQuotesPerDay: 5,
    bannerLabel: null,
    featuredAtTop: false,
    exposureLevel: 'LOW',
    newJobAlerts: true,
    customerSupportDays: 7,
    trialEnabled: true,
    trialDays: 14,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    prices: [
      {
        id: 'price-bronze-m',
        planId: 'plan-bronze',
        billingCycle: BillingCycle.MONTHLY,
        amount: 50.0 as any,
        currency: 'EUR',
        stripePriceId: null,
        mbwayPlanId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  const mockSilverPlan = {
    id: 'plan-silver',
    name: SubscriptionTier.SILVER,
    description: 'Silver Plan',
    maxTrades: 15,
    unlimitedTrades: false,
    maxPortfolioUploads: 15,
    allowPortfolioVideos: true,
    maxQuotesPerDay: 15,
    bannerLabel: 'Silver',
    featuredAtTop: false,
    exposureLevel: 'MEDIUM',
    newJobAlerts: true,
    customerSupportDays: 7,
    trialEnabled: true,
    trialDays: 14,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    prices: [
      {
        id: 'price-silver-m',
        planId: 'plan-silver',
        billingCycle: BillingCycle.MONTHLY,
        amount: 100.0 as any,
        currency: 'EUR',
        stripePriceId: null,
        mbwayPlanId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'price-silver-y',
        planId: 'plan-silver',
        billingCycle: BillingCycle.YEARLY,
        amount: 1000.0 as any,
        currency: 'EUR',
        stripePriceId: null,
        mbwayPlanId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  const mockGoldPlan = {
    id: 'plan-gold',
    name: SubscriptionTier.GOLD,
    description: 'Gold Plan',
    maxTrades: 999,
    unlimitedTrades: true,
    maxPortfolioUploads: 99,
    allowPortfolioVideos: true,
    maxQuotesPerDay: 99,
    bannerLabel: 'Gold Premium',
    featuredAtTop: true,
    exposureLevel: 'HIGH',
    newJobAlerts: true,
    customerSupportDays: 7,
    trialEnabled: true,
    trialDays: 14,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    prices: [
      {
        id: 'price-gold-m',
        planId: 'plan-gold',
        billingCycle: BillingCycle.MONTHLY,
        amount: 200.0 as any,
        currency: 'EUR',
        stripePriceId: null,
        mbwayPlanId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'price-gold-y',
        planId: 'plan-gold',
        billingCycle: BillingCycle.YEARLY,
        amount: 2000.0 as any,
        currency: 'EUR',
        stripePriceId: null,
        mbwayPlanId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  const mockInactivePlan = {
    id: 'plan-inactive',
    name: SubscriptionTier.BRONZE,
    isActive: false,
    prices: [],
  };

  beforeEach(async () => {
    const mockPrisma = {
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
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    const mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    prismaService = module.get(PrismaService);
  });

  /*
  |--------------------------------------------------------------------------
  | 1. TRIAL PERIOD SCENARIOS
  |--------------------------------------------------------------------------
  */
  describe('Trial Period Scenarios', () => {
    it('1.1 Should allow free upgrade Bronze -> Silver during trial (no payment, no history)', async () => {
      const futureTrialEnd = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const mockSub = {
        id: mockSubId,
        traderProfileId: mockTraderProfileId,
        planId: mockBronzePlan.id,
        currentPlanId: mockBronzePlan.id,
        priceId: 'price-bronze-m',
        billingCycle: BillingCycle.MONTHLY,
        status: SubscriptionStatus.TRIAL,
        isTrial: true,
        trialEndsAt: futureTrialEnd,
        plan: mockBronzePlan,
        currentPlan: mockBronzePlan,
        price: mockBronzePlan.prices[0],
      };

      (prismaService.traderProfile.findUnique as jest.Mock).mockResolvedValue({
        id: mockTraderProfileId,
        userId: mockUserId,
        subscription: mockSub,
      } as any);

      (prismaService.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(mockSilverPlan);

      const result = await service.changePlan(mockUserId, { planId: mockSilverPlan.id });

      expect(result.success).toBe(true);
      expect(result.data.trial).toBe(true);
      expect(result.data.proratedAmount).toBe(0);
      expect(result.data.currentPlan.id).toBe(mockSilverPlan.id);
      expect(prismaService.subscriptionPayment.create).not.toHaveBeenCalled();
      expect(prismaService.subscriptionHistory.create).not.toHaveBeenCalled();
    });

    it('1.2 Should allow free downgrade Silver -> Bronze during trial (no payment, no history)', async () => {
      const futureTrialEnd = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const mockSub = {
        id: mockSubId,
        traderProfileId: mockTraderProfileId,
        planId: mockSilverPlan.id,
        currentPlanId: mockSilverPlan.id,
        priceId: 'price-silver-m',
        billingCycle: BillingCycle.MONTHLY,
        status: SubscriptionStatus.TRIAL,
        isTrial: true,
        trialEndsAt: futureTrialEnd,
        plan: mockSilverPlan,
        currentPlan: mockSilverPlan,
        price: mockSilverPlan.prices[0],
      };

      (prismaService.traderProfile.findUnique as jest.Mock).mockResolvedValue({
        id: mockTraderProfileId,
        userId: mockUserId,
        subscription: mockSub,
      } as any);

      (prismaService.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(mockBronzePlan);

      const result = await service.changePlan(mockUserId, { planId: mockBronzePlan.id });

      expect(result.success).toBe(true);
      expect(result.data.trial).toBe(true);
      expect(result.data.proratedAmount).toBe(0);
      expect(result.data.currentPlan.id).toBe(mockBronzePlan.id);
      expect(prismaService.subscriptionPayment.create).not.toHaveBeenCalled();
      expect(prismaService.subscriptionHistory.create).not.toHaveBeenCalled();
    });

    it('1.3 Should charge final plan selected when trial expires (processRenewals)', async () => {
      const pastTrialEnd = new Date(Date.now() - 1000);
      const mockSubTrialExp = {
        id: mockSubId,
        traderProfileId: mockTraderProfileId,
        planId: mockSilverPlan.id,
        currentPlanId: mockSilverPlan.id,
        pendingPlanId: null,
        priceId: 'price-silver-m',
        billingCycle: BillingCycle.MONTHLY,
        status: SubscriptionStatus.TRIAL,
        isTrial: true,
        trialEndsAt: pastTrialEnd,
        plan: mockSilverPlan,
        currentPlan: mockSilverPlan,
        price: mockSilverPlan.prices[0],
      };

      (prismaService.subscription.findMany as jest.Mock).mockResolvedValue([mockSubTrialExp]);
      (prismaService.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(mockSilverPlan);

      const result = await service.processRenewals();

      expect(result.success).toBe(true);
      expect(result.data.processedCount).toBe(1);
      expect(prismaService.subscriptionPayment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subscriptionId: mockSubId,
          amount: 100.0,
          status: 'SUCCESS',
        }),
      });
      expect(prismaService.subscriptionHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subscriptionId: mockSubId,
          action: 'TRIAL_EXPIRATION_RENEWAL',
          toPlanId: mockSilverPlan.id,
          amount: 100.0,
        }),
      });
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 2. POST-TRIAL UPGRADE SCENARIOS (PRORATION)
  |--------------------------------------------------------------------------
  */
  describe('Post-Trial Upgrade Scenarios', () => {
    it('2.1 Monthly Upgrade Silver ($100) -> Gold ($200) on day 5 of 30 days cycle (remaining 25 days)', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      const periodEnd = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000);

      const mockSub = {
        id: mockSubId,
        traderProfileId: mockTraderProfileId,
        planId: mockSilverPlan.id,
        currentPlanId: mockSilverPlan.id,
        priceId: 'price-silver-m',
        billingCycle: BillingCycle.MONTHLY,
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        startDate: periodStart,
        endDate: periodEnd,
        plan: mockSilverPlan,
        currentPlan: mockSilverPlan,
        price: mockSilverPlan.prices[0], // $100
      };

      (prismaService.traderProfile.findUnique as jest.Mock).mockResolvedValue({
        id: mockTraderProfileId,
        userId: mockUserId,
        subscription: mockSub,
      } as any);

      (prismaService.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(mockGoldPlan);
      (prismaService.subscription.update as jest.Mock).mockResolvedValue({
        ...mockSub,
        currentPlanId: mockGoldPlan.id,
        currentPlan: mockGoldPlan,
      });

      const result = await service.changePlan(mockUserId, { planId: mockGoldPlan.id });

      expect(result.success).toBe(true);
      expect(result.data.trial).toBe(false);
      // Proration calculation: (200 - 100) * (25 / 30) = 83.33
      expect(result.data.proratedAmount).toBe(83.33);
      expect(prismaService.subscriptionPayment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subscriptionId: mockSubId,
          amount: 83.33,
          status: 'SUCCESS',
        }),
      });
      expect(prismaService.subscriptionHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subscriptionId: mockSubId,
          action: 'UPGRADE',
          amount: 83.33,
          proratedAmount: 83.33,
        }),
      });
    });

    it('2.2 Yearly Upgrade Silver ($1000) -> Gold ($2000) with 182.5 days remaining out of 365', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 182.5 * 24 * 60 * 60 * 1000);
      const periodEnd = new Date(now.getTime() + 182.5 * 24 * 60 * 60 * 1000);

      const mockSub = {
        id: mockSubId,
        traderProfileId: mockTraderProfileId,
        planId: mockSilverPlan.id,
        currentPlanId: mockSilverPlan.id,
        priceId: 'price-silver-y',
        billingCycle: BillingCycle.YEARLY,
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        startDate: periodStart,
        endDate: periodEnd,
        plan: mockSilverPlan,
        currentPlan: mockSilverPlan,
        price: mockSilverPlan.prices[1], // $1000
      };

      (prismaService.traderProfile.findUnique as jest.Mock).mockResolvedValue({
        id: mockTraderProfileId,
        userId: mockUserId,
        subscription: mockSub,
      } as any);

      (prismaService.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(mockGoldPlan);
      (prismaService.subscription.update as jest.Mock).mockResolvedValue({
        ...mockSub,
        currentPlanId: mockGoldPlan.id,
        currentPlan: mockGoldPlan,
      });

      const result = await service.changePlan(mockUserId, { planId: mockGoldPlan.id });

      expect(result.success).toBe(true);
      // Yearly Proration calculation: (2000 - 1000) * (182.5 / 365) = 500.00
      expect(result.data.proratedAmount).toBe(500.00);
      expect(prismaService.subscriptionPayment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subscriptionId: mockSubId,
          amount: 500.00,
        }),
      });
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 3. POST-TRIAL DOWNGRADE SCENARIOS (PENDING PLAN)
  |--------------------------------------------------------------------------
  */
  describe('Post-Trial Downgrade Scenarios', () => {
    it('3.1 Should schedule pending downgrade Gold -> Silver (no immediate change, 0 prorated charge)', async () => {
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

      const mockSub = {
        id: mockSubId,
        traderProfileId: mockTraderProfileId,
        planId: mockGoldPlan.id,
        currentPlanId: mockGoldPlan.id,
        priceId: 'price-gold-m',
        billingCycle: BillingCycle.MONTHLY,
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        currentPeriodEnd: periodEnd,
        endDate: periodEnd,
        plan: mockGoldPlan,
        currentPlan: mockGoldPlan,
        price: mockGoldPlan.prices[0], // $200
      };

      (prismaService.traderProfile.findUnique as jest.Mock).mockResolvedValue({
        id: mockTraderProfileId,
        userId: mockUserId,
        subscription: mockSub,
      } as any);

      (prismaService.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(mockSilverPlan);

      const result = await service.changePlan(mockUserId, { planId: mockSilverPlan.id });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Your downgrade will take effect from your next billing cycle.');
      expect(result.data.pendingPlan.id).toBe(mockSilverPlan.id);
      expect(result.data.proratedAmount).toBe(0);
      expect(prismaService.subscriptionPayment.create).not.toHaveBeenCalled();
    });

    it('3.2 Should clear pending downgrade when trader re-selects current active plan', async () => {
      const mockSub = {
        id: mockSubId,
        traderProfileId: mockTraderProfileId,
        planId: mockGoldPlan.id,
        currentPlanId: mockGoldPlan.id,
        pendingPlanId: mockSilverPlan.id,
        priceId: 'price-gold-m',
        billingCycle: BillingCycle.MONTHLY,
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        plan: mockGoldPlan,
        currentPlan: mockGoldPlan,
        price: mockGoldPlan.prices[0],
      };

      (prismaService.traderProfile.findUnique as jest.Mock).mockResolvedValue({
        id: mockTraderProfileId,
        userId: mockUserId,
        subscription: mockSub,
      } as any);

      (prismaService.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(mockGoldPlan);

      const result = await service.changePlan(mockUserId, { planId: mockGoldPlan.id });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Pending plan change cleared.');
      expect(prismaService.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockSubId },
          data: { pendingPlanId: null },
        }),
      );
    });

    it('3.3 Should inform trader if target plan is already scheduled as pending downgrade', async () => {
      const mockSub = {
        id: mockSubId,
        traderProfileId: mockTraderProfileId,
        planId: mockGoldPlan.id,
        currentPlanId: mockGoldPlan.id,
        pendingPlanId: mockSilverPlan.id,
        priceId: 'price-gold-m',
        billingCycle: BillingCycle.MONTHLY,
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        plan: mockGoldPlan,
        currentPlan: mockGoldPlan,
        pendingPlan: mockSilverPlan,
        price: mockGoldPlan.prices[0],
      };

      (prismaService.traderProfile.findUnique as jest.Mock).mockResolvedValue({
        id: mockTraderProfileId,
        userId: mockUserId,
        subscription: mockSub,
      } as any);

      (prismaService.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(mockSilverPlan);

      const result = await service.changePlan(mockUserId, { planId: mockSilverPlan.id });

      expect(result.success).toBe(true);
      expect(result.message).toContain('This plan is already scheduled as your pending downgrade.');
      expect(result.data.pendingPlan.id).toBe(mockSilverPlan.id);
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 4. RENEWAL PROCESS WITH PENDING DOWNGRADE
  |--------------------------------------------------------------------------
  */
  describe('Renewal Process with Pending Downgrade', () => {
    it('4.1 Should activate pending plan (Silver) and log DOWNGRADE_APPLIED upon period end renewal', async () => {
      const pastPeriodEnd = new Date(Date.now() - 1000);

      const mockSubDue = {
        id: mockSubId,
        traderProfileId: mockTraderProfileId,
        planId: mockGoldPlan.id,
        currentPlanId: mockGoldPlan.id,
        pendingPlanId: mockSilverPlan.id,
        priceId: 'price-gold-m',
        billingCycle: BillingCycle.MONTHLY,
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        currentPeriodEnd: pastPeriodEnd,
        plan: mockGoldPlan,
        currentPlan: mockGoldPlan,
        pendingPlan: mockSilverPlan,
        price: mockGoldPlan.prices[0],
      };

      (prismaService.subscription.findMany as jest.Mock).mockResolvedValue([mockSubDue]);
      (prismaService.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(mockSilverPlan);

      const result = await service.processRenewals();

      expect(result.success).toBe(true);
      expect(result.data.processedCount).toBe(1);
      expect(prismaService.subscriptionPayment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subscriptionId: mockSubId,
          amount: 100.0,
          status: 'SUCCESS',
        }),
      });
      expect(prismaService.subscriptionHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subscriptionId: mockSubId,
          action: 'DOWNGRADE_APPLIED',
          toPlanId: mockSilverPlan.id,
          amount: 100.0,
        }),
      });
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 5. VALIDATIONS AND EDGE CASES
  |--------------------------------------------------------------------------
  */
  describe('Validations and Edge Cases', () => {
    it('5.1 Should throw NotFoundException if trader profile is missing', async () => {
      (prismaService.traderProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.changePlan(mockUserId, { planId: mockGoldPlan.id }),
      ).rejects.toThrow(NotFoundException);
    });

    it('5.2 Should throw BadRequestException if subscription is cancelled', async () => {
      (prismaService.traderProfile.findUnique as jest.Mock).mockResolvedValue({
        id: mockTraderProfileId,
        userId: mockUserId,
        subscription: {
          id: mockSubId,
          status: SubscriptionStatus.CANCELLED,
        },
      } as any);

      await expect(
        service.changePlan(mockUserId, { planId: mockGoldPlan.id }),
      ).rejects.toThrow(BadRequestException);
    });

    it('5.3 Should throw BadRequestException if subscription is expired', async () => {
      (prismaService.traderProfile.findUnique as jest.Mock).mockResolvedValue({
        id: mockTraderProfileId,
        userId: mockUserId,
        subscription: {
          id: mockSubId,
          status: SubscriptionStatus.EXPIRED,
        },
      } as any);

      await expect(
        service.changePlan(mockUserId, { planId: mockGoldPlan.id }),
      ).rejects.toThrow(BadRequestException);
    });

    it('5.4 Should throw BadRequestException if target plan is inactive', async () => {
      (prismaService.traderProfile.findUnique as jest.Mock).mockResolvedValue({
        id: mockTraderProfileId,
        userId: mockUserId,
        subscription: {
          id: mockSubId,
          status: SubscriptionStatus.ACTIVE,
          currentPlanId: mockSilverPlan.id,
          plan: mockSilverPlan,
          currentPlan: mockSilverPlan,
        },
      } as any);

      (prismaService.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(mockInactivePlan as any);

      await expect(
        service.changePlan(mockUserId, { planId: mockInactivePlan.id }),
      ).rejects.toThrow(BadRequestException);
    });

    it('5.5 Should throw BadRequestException if target plan has no active price for matching billing cycle', async () => {
      (prismaService.traderProfile.findUnique as jest.Mock).mockResolvedValue({
        id: mockTraderProfileId,
        userId: mockUserId,
        subscription: {
          id: mockSubId,
          status: SubscriptionStatus.ACTIVE,
          billingCycle: BillingCycle.YEARLY,
          currentPlanId: mockSilverPlan.id,
          plan: mockSilverPlan,
          currentPlan: mockSilverPlan,
        },
      } as any);

      (prismaService.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(mockBronzePlan);

      await expect(
        service.changePlan(mockUserId, { planId: mockBronzePlan.id }),
      ).rejects.toThrow(BadRequestException);
    });

    it('5.6 Should throw BadRequestException if target plan is same as current active plan and no pending plan set', async () => {
      (prismaService.traderProfile.findUnique as jest.Mock).mockResolvedValue({
        id: mockTraderProfileId,
        userId: mockUserId,
        subscription: {
          id: mockSubId,
          status: SubscriptionStatus.ACTIVE,
          billingCycle: BillingCycle.MONTHLY,
          currentPlanId: mockGoldPlan.id,
          pendingPlanId: null,
          plan: mockGoldPlan,
          currentPlan: mockGoldPlan,
        },
      } as any);

      (prismaService.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(mockGoldPlan);

      await expect(
        service.changePlan(mockUserId, { planId: mockGoldPlan.id }),
      ).rejects.toThrow(BadRequestException);
    });

    it('5.7 Should cancel pending downgrade using cancelPendingDowngrade()', async () => {
      const mockSub = {
        id: mockSubId,
        traderProfileId: mockTraderProfileId,
        planId: mockGoldPlan.id,
        currentPlanId: mockGoldPlan.id,
        pendingPlanId: mockSilverPlan.id,
        status: SubscriptionStatus.ACTIVE,
        plan: mockGoldPlan,
        currentPlan: mockGoldPlan,
      };

      (prismaService.traderProfile.findUnique as jest.Mock).mockResolvedValue({
        id: mockTraderProfileId,
        userId: mockUserId,
        subscription: mockSub,
      } as any);

      const result = await service.cancelPendingDowngrade(mockUserId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Pending plan change cancelled successfully');
      expect(prismaService.subscription.update).toHaveBeenCalledWith({
        where: { id: mockSubId },
        data: { pendingPlanId: null },
      });
    });

    it('5.8 Should throw BadRequestException in cancelPendingDowngrade() if no pending plan exists', async () => {
      const mockSub = {
        id: mockSubId,
        traderProfileId: mockTraderProfileId,
        planId: mockGoldPlan.id,
        currentPlanId: mockGoldPlan.id,
        pendingPlanId: null,
        status: SubscriptionStatus.ACTIVE,
      };

      (prismaService.traderProfile.findUnique as jest.Mock).mockResolvedValue({
        id: mockTraderProfileId,
        userId: mockUserId,
        subscription: mockSub,
      } as any);

      await expect(
        service.cancelPendingDowngrade(mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('5.9 Should support multi-tier jump (Bronze -> Gold skipping Silver) during post-trial upgrade', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      const periodEnd = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);

      const mockSub = {
        id: mockSubId,
        traderProfileId: mockTraderProfileId,
        planId: mockBronzePlan.id,
        currentPlanId: mockBronzePlan.id,
        priceId: 'price-bronze-m',
        billingCycle: BillingCycle.MONTHLY,
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        plan: mockBronzePlan,
        currentPlan: mockBronzePlan,
        price: mockBronzePlan.prices[0], // $50
      };

      (prismaService.traderProfile.findUnique as jest.Mock).mockResolvedValue({
        id: mockTraderProfileId,
        userId: mockUserId,
        subscription: mockSub,
      } as any);

      (prismaService.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(mockGoldPlan);
      (prismaService.subscription.update as jest.Mock).mockResolvedValue({
        ...mockSub,
        currentPlanId: mockGoldPlan.id,
        currentPlan: mockGoldPlan,
      });

      const result = await service.changePlan(mockUserId, { planId: mockGoldPlan.id });

      expect(result.success).toBe(true);
      // Proration diff: ($200 - $50) * (20 / 30) = $100.00
      expect(result.data.proratedAmount).toBe(100.00);
      expect(prismaService.subscriptionHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'UPGRADE',
          fromPlanId: mockBronzePlan.id,
          toPlanId: mockGoldPlan.id,
          amount: 100.00,
        }),
      });
    });

    it('5.10 Should process normal active renewal (no pending plan) with action RENEWAL', async () => {
      const pastPeriodEnd = new Date(Date.now() - 1000);

      const mockSubDue = {
        id: mockSubId,
        traderProfileId: mockTraderProfileId,
        planId: mockGoldPlan.id,
        currentPlanId: mockGoldPlan.id,
        pendingPlanId: null,
        priceId: 'price-gold-m',
        billingCycle: BillingCycle.MONTHLY,
        status: SubscriptionStatus.ACTIVE,
        isTrial: false,
        currentPeriodEnd: pastPeriodEnd,
        plan: mockGoldPlan,
        currentPlan: mockGoldPlan,
        price: mockGoldPlan.prices[0],
      };

      (prismaService.subscription.findMany as jest.Mock).mockResolvedValue([mockSubDue]);
      (prismaService.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(mockGoldPlan);

      const result = await service.processRenewals();

      expect(result.success).toBe(true);
      expect(result.data.processedCount).toBe(1);
      expect(prismaService.subscriptionHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'RENEWAL',
          toPlanId: mockGoldPlan.id,
          amount: 200.0,
        }),
      });
    });
  });
});
