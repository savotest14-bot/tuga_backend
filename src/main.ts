import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import {
  SwaggerModule,
  DocumentBuilder,
} from '@nestjs/swagger';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';

async function bootstrap() {
  const app =
    await NestFactory.create(AppModule);
  const configService =
    app.get(ConfigService);

  const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS')?.split(',') || ['http://localhost:3000', 'http://localhost:4000'];
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalFilters(new GlobalExceptionFilter());

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  // Global API Prefix
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger Config
  const config =
    new DocumentBuilder()
      .setTitle('TugaTrades API')
      .setDescription(
        'TugaTrades Backend APIs',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
        },
        'access-token',
      )

      .build();

  const document =
    SwaggerModule.createDocument(
      app,
      config,
    );

  SwaggerModule.setup(
    'api/docs',
    app,
    document,
  );

  const port =
    configService.get<number>('PORT') ||
    3000;

  await app.listen(port);

  console.log(
    `🚀 Server running on port ${port}`,
  );

  console.log(
    `📘 Swagger running on http://localhost:${port}/api/docs`,
  );
}

bootstrap();