import { SetMetadata } from '@nestjs/common';

export const RateLimit = (limit: number, ttlSeconds: number = 60) =>
  SetMetadata('rateLimit', { limit, ttl: ttlSeconds });
