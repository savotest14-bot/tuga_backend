import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { FaqAudience } from '@prisma/client';

@Injectable()
export class FaqService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async create(body: CreateFaqDto) {
    const faq =
      await this.prisma.faq.create({
        data: body,
      });

    await this.redis.deleteByPattern(
      'faq:*',
    );

    return {
      success: true,
      message: 'FAQ created successfully',
      data: faq,
    };
  }

  async findAll(
    page = 1,
    limit = 10,
    audience?: string,
    isActive?: string,
  ) {
    const cacheKey = `faq:list:${page}:${limit}:${audience}:${isActive}`;

    const cached =
      await this.redis.get(cacheKey);

    if (cached) {
      return cached;
    }

    const where: any = {};

    if (audience) {
      where.audience = audience;
    }

    if (isActive !== undefined) {
      where.isActive =
        isActive === 'true';
    }

    const [data, total] =
      await Promise.all([
        this.prisma.faq.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [
            {
              sortOrder: 'asc',
            },
            {
              createdAt: 'desc',
            },
          ],
        }),

        this.prisma.faq.count({
          where,
        }),
      ]);

    const response = {
      success: true,
      total,
      page,
      limit,
      data,
    };

    await this.redis.set(
      cacheKey,
      response,
      3600,
    );

    return response;
  }

  async findOne(id: string) {
    const cacheKey = `faq:${id}`;

    const cached =
      await this.redis.get(cacheKey);

    if (cached) {
      return cached;
    }

    const faq =
      await this.prisma.faq.findUnique({
        where: { id },
      });

    if (!faq) {
      throw new BadRequestException(
        'FAQ not found',
      );
    }

    const response = {
      success: true,
      data: faq,
    };

    await this.redis.set(
      cacheKey,
      response,
      3600,
    );

    return response;
  }

  async update(
    id: string,
    body: UpdateFaqDto,
  ) {
    const faq =
      await this.prisma.faq.findUnique({
        where: { id },
      });

    if (!faq) {
      throw new BadRequestException(
        'FAQ not found',
      );
    }

    const updated =
      await this.prisma.faq.update({
        where: { id },
        data: body,
      });

    await this.redis.deleteByPattern(
      'faq:*',
    );

    return {
      success: true,
      message: 'FAQ updated successfully',
      data: updated,
    };
  }

  async remove(id: string) {
    const faq =
      await this.prisma.faq.findUnique({
        where: { id },
      });

    if (!faq) {
      throw new BadRequestException(
        'FAQ not found',
      );
    }

    await this.prisma.faq.delete({
      where: { id },
    });

    await this.redis.deleteByPattern(
      'faq:*',
    );

    return {
      success: true,
      message: 'FAQ deleted successfully',
    };
  }

  async publicFaqs(
    audience?: FaqAudience,
  ) {
    const cacheKey = `faq:public:${audience}`;

    const cached =
      await this.redis.get(cacheKey);

    if (cached) {
      return cached;
    }

    const faqs =
      await this.prisma.faq.findMany({
        where: {
          isActive: true,
          ...(audience && {
            OR: [
              {
                audience,
              },
              {
                audience: 'BOTH',
              },
            ],
          }),
        },
        orderBy: {
          sortOrder: 'asc',
        },
      });

    const response = {
      success: true,
      data: faqs,
    };

    await this.redis.set(
      cacheKey,
      response,
      3600,
    );

    return response;
  }
}