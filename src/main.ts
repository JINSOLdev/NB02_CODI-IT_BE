import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { setupSentry } from './common/logger/sentry.config';
import { SentryGlobalFilter } from './common/logger/sentry.filter';
import type { Request, Response, NextFunction } from 'express';

function buildCorsOrigin() {
  const list = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (list.length === 0) list.push('http://localhost:3001');

  // 동적 origin 검사 콜백 함수 반환
  return (
    origin: string | undefined,
    cb: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin) return cb(null, true);
    cb(null, list.includes(origin));
  };
}

async function bootstrap() {
  setupSentry();

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  app.useGlobalFilters(new SentryGlobalFilter());

  // CORS 전역 설정 (개발/배포 공통)
  app.enableCors({
    origin: buildCorsOrigin(),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 204,
  });

  // '/users', '/auth'로 들어오는 요청을 '/api/users', '/api/auth'로 리다이렉트
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const url = String(req.url ?? '');
    if (/^\/(users|auth)(\/|$)/.test(url)) {
      req.url = `/api${url}`;
    }
    next();
  });

  // 전역 파이프
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Codi-it API Docs')
    .setDescription('상품/주문/스토어 API 명세')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // 기존 '/api'에서 '/api/docs'로 분리 (API 라우트와 충돌 방지)
  SwaggerModule.setup('api/docs', app, document);

  // 서버 실행
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📘 Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error(`bootstrap failed: ${String(err)}`);
  process.exit(1);
});
