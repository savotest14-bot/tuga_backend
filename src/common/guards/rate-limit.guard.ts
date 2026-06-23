import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly redisService: RedisService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();
    
    // Check metadata first
    const limitMeta = this.reflector.get<{ limit: number; ttl: number }>('rateLimit', handler);
    
    const path = request.path;
    const method = request.method;
    
    // AuthMiddleware attaches req.user
    const user = request['user'] as any;
    const identifier = user?.id || request.ip || 'anonymous';
    
    let limit = 100;
    let ttl = 60; // default 1 minute (60 seconds)
    
    if (limitMeta) {
      limit = limitMeta.limit;
      ttl = limitMeta.ttl;
    } else {
      // Dynamic rules based on path
      if (path.includes('/auth/otp') || path.includes('/auth/forgot-password') || path.includes('/auth/resend')) {
        limit = 5;
      } else if (path.includes('/auth/login')) {
        limit = 10;
      } else if (path.includes('/auth/customer/register') || path.includes('/auth/trader/register')) {
        limit = 5;
      }
    }
    
    const redisKey = `rate_limit:${method}:${path}:${identifier}`;
    const current = await this.redisService.incr(redisKey);
    
    if (current === 1) {
      await this.redisService.expire(redisKey, ttl);
    }
    
    if (current > limit) {
      const remainingTtl = await this.redisService.ttl(redisKey);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many requests. Please try again in ${remainingTtl > 0 ? remainingTtl : ttl} seconds.`,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    
    return true;
  }
}
