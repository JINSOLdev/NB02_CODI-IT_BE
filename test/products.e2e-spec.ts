import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ProductsModule } from '../src/products/products.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { Express } from 'express';

describe('Products API (e2e)', () => {
  let app: INestApplication;
  let server: Express;
  let productId: string;
  let inquiryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, ProductsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

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

    productId = res.body.id;
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('테스트 상품');
  });

  it('/products (GET) 상품 목록 조회', async () => {
    const res = await request(server).get('/products').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('/products/:id (PATCH) 상품 수정', async () => {
    const res = await request(server)
      .patch(`/products/${productId}`)
      .send({
        name: '수정된 상품',
        price: 15000,
      })
      .expect(200);

    expect(res.body.name).toBe('수정된 상품');
    expect(res.body.price).toBe(15000);
  });

  it('/products/:id/inquiries (POST) 상품 문의 등록', async () => {
    const res = await request(server)
      .post(`/products/${productId}/inquiries`)
      .send({
        title: '배송 문의',
        content: '언제 배송되나요?',
        userId: '구매자CUID', // ✅ 시드 데이터 값
      })
      .expect(201);

    inquiryId = res.body.id;
    expect(res.body.title).toBe('배송 문의');
    expect(res.body.productId).toBe(productId);
  });

  it('/products/:id/inquiries (GET) 상품 문의 목록 조회', async () => {
    const res = await request(server)
      .get(`/products/${productId}/inquiries`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].id).toBe(inquiryId);
  });

  it('/products/:id (DELETE) 상품 삭제', async () => {
    await request(server).delete(`/products/${productId}`).expect(204); // ✅ 200 → 204

    // 삭제 확인: 다시 조회하면 404
    await request(server).get(`/products/${productId}`).expect(404);
  });

  afterAll(async () => {
    await app.close();
  });
});
