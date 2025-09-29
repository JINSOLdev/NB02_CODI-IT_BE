import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';
import { ProductsModule } from '../src/products/products.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Express } from 'express';

// ✅ 시드 파일 기준 test_* ID 사용
const mockStoreId = 'test_store_id';
const mockUserId = 'test_buyer_id';
const mockCategoryId = 'test_category_id';
const mockSizeId = 'test_size_id';

describe('Products API (e2e)', () => {
  let app: INestApplication;
  let server: Express;
  let prisma: PrismaService;
  let productId: string;
  let inquiryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, ProductsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    server = app.getHttpServer() as unknown as Express;
    prisma = app.get(PrismaService);
  });

  it('/products (POST) 상품 등록', async () => {
    const res: Response = await request(server)
      .post('/products')
      // ✅ 헤더에 JSON 문자열 전달
      .set('x-mock-user', JSON.stringify({ id: mockStoreId }))
      .send({
        name: '테스트 상품',
        price: 10000,
        content: '상품 설명',
        categoryId: mockCategoryId,
        discountRate: 20,
        stocks: [{ sizeId: mockSizeId, quantity: 5 }],
      })
      .expect(201);

    const body = res.body as {
      id: string;
      name: string;
      price: number;
      discountPrice: number | null;
    };

    productId = body.id;
    expect(body).toHaveProperty('id');
    expect(body.name).toBe('테스트 상품');
    expect(body.discountPrice).toBe(8000); // 10000 - 20% = 8000
  });

  it('/products (GET) 상품 목록 조회', async () => {
    const res: Response = await request(server).get('/products').expect(200);

    const body = res.body as {
      id: string;
      name: string;
      price: number;
    }[];

    expect(Array.isArray(body)).toBe(true);
    expect(body.find((p) => p.id === productId)).toBeTruthy();
  });

  it('/products/:id (PATCH) 상품 수정', async () => {
    const res: Response = await request(server)
      .patch(`/products/${productId}`)
      .set('x-mock-user', JSON.stringify({ id: mockStoreId }))
      .send({
        name: '수정된 상품',
        price: 15000,
        discountRate: 10,
      })
      .expect(200);

    const body = res.body as {
      id: string;
      name: string;
      price: number;
      discountPrice: number | null;
    };

    expect(body.name).toBe('수정된 상품');
    expect(body.price).toBe(15000);
    expect(body.discountPrice).toBe(13500); // 15000 - 10% = 13500
  });

  it('/products/:id/inquiries (POST) 상품 문의 등록', async () => {
    const res: Response = await request(server)
      .post(`/products/${productId}/inquiries`)
      // ✅ 유저도 헤더에 JSON 문자열로 전달
      .set('x-mock-user', JSON.stringify({ id: mockUserId }))
      .send({
        title: '배송 문의',
        content: '언제 배송되나요?',
      })
      .expect(201);

    const body = res.body as {
      id: string;
      title: string;
      content: string;
      productId: string;
    };

    inquiryId = body.id;
    expect(body.title).toBe('배송 문의');
    expect(body.productId).toBe(productId);
  });

  it('/products/:id/inquiries (GET) 상품 문의 목록 조회', async () => {
    const res: Response = await request(server)
      .get(`/products/${productId}/inquiries`)
      .expect(200);

    const body = res.body as {
      id: string;
      title: string;
      content: string;
      productId: string;
    }[];

    expect(Array.isArray(body)).toBe(true);
    expect(body[0].id).toBe(inquiryId);
  });

  it('/products/:id (DELETE) 상품 삭제', async () => {
    await request(server)
      .delete(`/products/${productId}`)
      .set('x-mock-user', JSON.stringify({ id: mockStoreId }))
      .expect(204);

    // 삭제 확인: 다시 조회하면 404
    await request(server).get(`/products/${productId}`).expect(404);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect(); // ✅ Prisma 연결 종료
  });
});
