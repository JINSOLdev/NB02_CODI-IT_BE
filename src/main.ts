import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ 전역 미들웨어 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // ✅ Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Codi-it API Docs')
    .setDescription('상품/주문/스토어 API 명세')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // ✅ 서버 실행
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(` Server running on http://localhost:${port}`);
  console.log(` Swagger docs available at http://localhost:${port}/api`);
}

bootstrap().catch((err) => {
  console.error(`bootstrap failed: ${err}`);
  process.exit(1);
});
