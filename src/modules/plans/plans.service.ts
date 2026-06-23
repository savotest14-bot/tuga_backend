import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { BillingCycle } from '@prisma/client';

import { UpdatePlanDto } from './dto/update-plan.dto';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private redisService: RedisService,
  ) { }

  // Get All Plans
  async getAllPlans() {

    const cacheKey = 'subscription:plans';

    const cached =
      await this.redisService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const plans =
      await this.prisma.subscriptionPlan.findMany({
        include: {
          prices: {
            orderBy: {
              billingCycle: 'asc',
            },
          },
        },

        orderBy: {
          createdAt: 'asc',
        },
      });

    await this.redisService.set(
      cacheKey,
      plans,
      86400, // 24 hour
    );

    return plans;
  }

  // Update Plan
  async updatePlan(
    id: string,
    dto: UpdatePlanDto,
  ) {
    const plan =
      await this.prisma.subscriptionPlan.findUnique({
        where: { id },

        include: {
          prices: true,
        },
      });

    if (!plan) {
      throw new BadRequestException(
        'Plan not found',
      );
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE PLAN
    |--------------------------------------------------------------------------
    */

    await this.prisma.subscriptionPlan.update({
      where: { id },

      data: {
        description:
          dto.description,

        /*
        |--------------------------------------------------------------------------
        | PLAN LIMITS
        |--------------------------------------------------------------------------
        */

        maxTrades:
          dto.maxTrades,

        unlimitedTrades:
          dto.unlimitedTrades,

        maxPortfolioUploads:
          dto.maxPortfolioUploads,

        allowPortfolioVideos:
          dto.allowPortfolioVideos,

        maxQuotesPerDay:
          dto.maxQuotesPerDay,

        /*
        |--------------------------------------------------------------------------
        | VISIBILITY & EXPOSURE
        |--------------------------------------------------------------------------
        */

        bannerLabel:
          dto.bannerLabel,

        featuredAtTop:
          dto.featuredAtTop,

        exposureLevel:
          dto.exposureLevel,

        /*
        |--------------------------------------------------------------------------
        | FEATURES
        |--------------------------------------------------------------------------
        */

        newJobAlerts:
          dto.newJobAlerts,

        customerSupportDays:
          dto.customerSupportDays,

        /*
        |--------------------------------------------------------------------------
        | TRIAL
        |--------------------------------------------------------------------------
        */

        trialEnabled:
          dto.trialEnabled,

        trialDays:
          dto.trialDays,

        /*
        |--------------------------------------------------------------------------
        | STATUS
        |--------------------------------------------------------------------------
        */

        isActive:
          dto.isActive,
      },
    });

    /*
    |--------------------------------------------------------------------------
    | UPDATE MONTHLY PRICE
    |--------------------------------------------------------------------------
    */

    if (
      dto.monthlyPrice !==
      undefined
    ) {
      await this.prisma.subscriptionPrice.update({
        where: {
          planId_billingCycle: {
            planId: id,

            billingCycle:
              BillingCycle.MONTHLY,
          },
        },

        data: {
          amount:
            dto.monthlyPrice,
        },
      });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE YEARLY PRICE
    |--------------------------------------------------------------------------
    */

    if (
      dto.yearlyPrice !==
      undefined
    ) {
      await this.prisma.subscriptionPrice.update({
        where: {
          planId_billingCycle: {
            planId: id,

            billingCycle:
              BillingCycle.YEARLY,
          },
        },

        data: {
          amount:
            dto.yearlyPrice,
        },
      });
    }

    /*
    |--------------------------------------------------------------------------
    | RETURN UPDATED PLAN
    |--------------------------------------------------------------------------
    */

    await this.redisService.del(
      'subscription:plans',
    );

    return this.prisma.subscriptionPlan.findUnique({
      where: { id },

      include: {
        prices: true,
      },
    });
  }
}