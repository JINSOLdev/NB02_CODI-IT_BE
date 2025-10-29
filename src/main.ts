import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { setupSentry } from './common/logger/sentry.config';
import { SentryGlobalFilter } from './common/logger/sentry.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { resolve } from 'path';

const ALLOW_ORIGINS = [
  'https://nb-02-codi-it-fe.vercel.app',
  'https://codi-it.shop',
  'http://localhost:3001',
  'http://localhost:3000',
];

async function bootstrap() {
  setupSentry();

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  app.enableCors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // curl/서버간 호출 허용
      cb(null, ALLOW_ORIGINS.includes(origin));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 204,
  });

  app.use(cookieParser());

  const UPLOAD_DIR =
    process.env.UPLOAD_DIR || resolve(process.cwd(), 'uploads');
  app.use('/uploads', express.static(UPLOAD_DIR));
  console.log('[uploads] serving from:', UPLOAD_DIR);

  app.useGlobalFilters(new SentryGlobalFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('CODI-IT')
    .setDescription('CODI-IT API 명세입니다.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('bootstrap failed: ', err);
  process.exit(1);
});