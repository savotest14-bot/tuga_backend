import {
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';

import Redis from 'ioredis';

@Injectable()
export class RedisService
  implements OnModuleDestroy {
  private redis: Redis;

  constructor() {

    this.redis = new Redis({
      host:
        process.env.REDIS_HOST ||
        '127.0.0.1',

      port:
        Number(
          process.env.REDIS_PORT,
        ) || 6379,

      password:
        process.env.REDIS_PASSWORD ||
        undefined,
    });

    // Connected

    this.redis.on(
      'connect',
      () => {
        console.log(
          '✅ Redis Connected',
        );
      },
    );

    // Error

    this.redis.on(
      'error',
      (err) => {
        console.log(
          '❌ Redis Error',
          err.message,
        );
      },
    );
  }

  // SET

  async set(
    key: string,
    value: any,
    ttl?: number,
  ) {

    const data =
      JSON.stringify(value);

    if (ttl) {

      await this.redis.set(
        key,
        data,
        'EX',
        ttl,
      );

    } else {

      await this.redis.set(
        key,
        data,
      );
    }
  }

  // GET

  async get<T>(
    key: string,
  ): Promise<T | null> {

    const data =
      await this.redis.get(key);

    return data
      ? JSON.parse(data)
      : null;
  }

  // DELETE

  async del(
    key: string,
  ) {

    await this.redis.del(key);
  }

  // INCR

  async incr(key: string): Promise<number> {
    return await this.redis.incr(key);
  }

  // EXPIRE

  async expire(key: string, seconds: number): Promise<number> {
    return await this.redis.expire(key, seconds);
  }

  // ACQUIRE LOCK (NX PX)

  async acquireLock(
    key: string,
    ttlMs: number,
  ): Promise<boolean> {

    const result = await this.redis.call(
      'SET',
      key,
      'locked',
      'PX',
      ttlMs,
      'NX',
    );

    return result === 'OK';
  }

  // RELEASE LOCK

  async releaseLock(key: string): Promise<void> {
    await this.redis.del(key);
  }

  // EXISTS

  async exists(
    key: string,
  ) {

    return await this.redis.exists(
      key,
    );
  }

  // TTL

  async ttl(
    key: string,
  ) {

    return await this.redis.ttl(
      key,
    );
  }

  // CLEAR ALL CACHE

  async flushAll() {

    await this.redis.flushall();
  }

  // CLOSE CONNECTION

  async onModuleDestroy() {

    await this.redis.quit();

    console.log(
      '❌ Redis Disconnected',
    );
  }

  async deleteByPattern(
    pattern: string,
  ) {
    const keys =
      await this.redis.keys(
        pattern,
      );

    if (keys.length) {
      await this.redis.del(
        ...keys,
      );
    }
  }

  async decr(
    key: string,
  ): Promise<number> {

    return await this.redis.decr(
      key,
    );
  }
}