import { Injectable, OnModuleInit } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionPlanSeeder
  implements OnModuleInit
{
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.seedPlans();
  }

  async seedPlans() {
    const plans = [
      {
        name: 'BRONZE',

        description:
          'Bronze subscription plan',

        maxTrades: 1,

        unlimitedTrades: false,

        maxPortfolioUploads: 5,

        allowPortfolioVideos: false,

        maxQuotesPerDay: 3,

        bannerLabel: 'Bronze',

        featuredAtTop: false,

        exposureLevel: 'STANDARD',

        newJobAlerts: true,

        customerSupportDays: 7,

        trialDays: 90,

        monthlyPrice: 14.99,

        yearlyPrice: 99.99,
      },

      {
        name: 'SILVER',

        description:
          'Silver subscription plan',

        maxTrades: 3,

        unlimitedTrades: false,

        maxPortfolioUploads: 20,

        allowPortfolioVideos: true,

        maxQuotesPerDay: 10,

        bannerLabel: 'Silver',

        featuredAtTop: false,

        exposureLevel: 'INCREASED',

        newJobAlerts: true,

        customerSupportDays: 7,

        trialDays: 90,

        monthlyPrice: 24.99,

        yearlyPrice: 199.99,
      },

      {
        name: 'GOLD',

        description:
          'Gold subscription plan',

        maxTrades: 9999,

        unlimitedTrades: true,

        maxPortfolioUploads: 50,

        allowPortfolioVideos: true,

        maxQuotesPerDay: 20,

        bannerLabel: 'Gold',

        featuredAtTop: true,

        exposureLevel: 'MAXIMUM',

        newJobAlerts: true,

        customerSupportDays: 7,

        trialDays: 90,

        monthlyPrice: 39.99,

        yearlyPrice: 299.99,
      },
    ];

    for (const plan of plans) {
      /*
      |--------------------------------------------------------------------------
      | CREATE OR UPDATE PLAN
      |--------------------------------------------------------------------------
      */

      const createdPlan =
        await this.prisma.subscriptionPlan.upsert({
          where: {
            name: plan.name as any,
          },

          update: {
            description:
              plan.description,

            maxTrades:
              plan.maxTrades,

            unlimitedTrades:
              plan.unlimitedTrades,

            maxPortfolioUploads:
              plan.maxPortfolioUploads,

            allowPortfolioVideos:
              plan.allowPortfolioVideos,

            maxQuotesPerDay:
              plan.maxQuotesPerDay,

            bannerLabel:
              plan.bannerLabel,

            featuredAtTop:
              plan.featuredAtTop,

            exposureLevel:
              plan.exposureLevel,

            newJobAlerts:
              plan.newJobAlerts,

            customerSupportDays:
              plan.customerSupportDays,

            trialDays:
              plan.trialDays,

            isActive: true,
          },

          create: {
            name: plan.name as any,

            description:
              plan.description,

            maxTrades:
              plan.maxTrades,

            unlimitedTrades:
              plan.unlimitedTrades,

            maxPortfolioUploads:
              plan.maxPortfolioUploads,

            allowPortfolioVideos:
              plan.allowPortfolioVideos,

            maxQuotesPerDay:
              plan.maxQuotesPerDay,

            bannerLabel:
              plan.bannerLabel,

            featuredAtTop:
              plan.featuredAtTop,

            exposureLevel:
              plan.exposureLevel,

            newJobAlerts:
              plan.newJobAlerts,

            customerSupportDays:
              plan.customerSupportDays,

            trialDays:
              plan.trialDays,

            isActive: true,
          },
        });

      /*
      |--------------------------------------------------------------------------
      | MONTHLY PRICE
      |--------------------------------------------------------------------------
      */

      await this.prisma.subscriptionPrice.upsert({
        where: {
          planId_billingCycle: {
            planId: createdPlan.id,

            billingCycle: 'MONTHLY',
          },
        },

        update: {
          amount: plan.monthlyPrice,

          currency: 'EUR',

          isActive: true,
        },

        create: {
          planId: createdPlan.id,

          billingCycle: 'MONTHLY',

          amount: plan.monthlyPrice,

          currency: 'EUR',
        },
      });

      /*
      |--------------------------------------------------------------------------
      | YEARLY PRICE
      |--------------------------------------------------------------------------
      */

      await this.prisma.subscriptionPrice.upsert({
        where: {
          planId_billingCycle: {
            planId: createdPlan.id,

            billingCycle: 'YEARLY',
          },
        },

        update: {
          amount: plan.yearlyPrice,

          currency: 'EUR',

          isActive: true,
        },

        create: {
          planId: createdPlan.id,

          billingCycle: 'YEARLY',

          amount: plan.yearlyPrice,

          currency: 'EUR',
        },
      });
    }

    console.log(
      '✅ Subscription plans seeded successfully',
    );
  }
  
}