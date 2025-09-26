import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ProductsModule } from '../src/products/products.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { Express } from 'express';

describe('Products API (e2e)', () => {
  let app: INestApplication;
  let server: Express;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, ProductsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // ✅ supertest 타입 단언
    server = app.getHttpServer() as unknown as Express;
  });

  it('/products (POST) 상품 등록', async () => {
    const res = await request(server)
      .post('/products')
      .send({
        name: '테스트 상품',
        price: 10000,
        content: '상품 설명',
        storeId: '스토어CUID',
        categoryId: '카테고리CUID',
        stocks: [{ sizeId: '사이즈CUID', quantity: 5 }],
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('테스트 상품');
  });

  it('/products (GET) 상품 목록 조회', async () => {
    const res = await request(server).get('/products').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  afterAll(async () => {
    await app.close();
  });
});
