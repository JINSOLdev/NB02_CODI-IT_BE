import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { setupSentry } from './common/logger/sentry.config';
import { SentryGlobalFilter } from './common/logger/sentry.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// type Matcher = string | RegExp;

// function buildCorsOrigin(): (
//   origin: string | undefined,
//   cb: (err: Error | null, allow?: boolean) => void,
// ) => void {
//   const raw = (process.env.CORS_ORIGINS ?? '')
//     .split(',')
//     .map((origin) => origin.trim())
//     .filter(Boolean);

//   // 로컬
//   if (raw.length === 0) raw.push('http://localhost:3001');

//   // 와일드카드
//   const allowList: Matcher[] = raw.map((originPattern) => {
//     if (originPattern.startsWith('*.')) {
//       const host = originPattern.slice(2).replace(/\./g, '\\.');
//       return new RegExp(
//         `^https?:\\/\\/([a-z0-9-]+\\.)*${host}(?::\\d+)?$`,
//         'i',
//       );
//     }
//     return originPattern;
//   });

//   const isAllowed = (origin: string): boolean => {
//     return allowList.some((rule) => {
//       if (rule instanceof RegExp) return rule.test(origin);
//       return rule === origin;
//     });
//   };

//   return (origin, cb) => {
//     if (!origin) return cb(null, true);
//     const ok = isAllowed(origin);
//     return cb(ok ? null : new Error(`Not allowed by CORS: ${origin}`), ok);
//   };
// }

async function bootstrap() {
  setupSentry();

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  app.enableCors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 204,
  });

  app.use(cookieParser());

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
