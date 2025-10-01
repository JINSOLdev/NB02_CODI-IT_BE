import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';
import { ProductsModule } from '../src/products/products.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Express } from 'express';

// ✅ 시드 파일 기준 test_* ID 사용
const mockUserId = 'test_buyer_id'; // 구매자 유저 ID
const mockSellerId = 'test_seller_id'; // 판매자 유저 ID (스토어 주인)

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
      // ✅ 반드시 판매자 유저 ID로 등록해야 store를 찾을 수 있음
      .set('x-mock-user', JSON.stringify({ id: mockSellerId }))
      .send({
        name: '테스트 상품',
        price: 10000,
        content: '상품 설명',
        categoryName: 'TOP',
        discountRate: 20,
        stocks: [{ sizeName: 'M', quantity: 5 }],
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
    expect(body.discountPrice).toBe(8000);
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
      .set('x-mock-user', JSON.stringify({ id: mockSellerId })) // ✅ 판매자 유저 ID
      .send({
        name: '수정된 상품',
        price: 15000,
        discountRate: 10,
        categoryName: 'TOP',
        stocks: [{ sizeName: 'M', quantity: 3 }],
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
    expect(body.discountPrice).toBe(13500);
  });

  it('/products/:id/inquiries (POST) 상품 문의 등록', async () => {
    const res: Response = await request(server)
      .post(`/products/${productId}/inquiries`)
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

  it('/products/:id/inquiries (POST) 비밀글 문의 등록', async () => {
    const res: Response = await request(server)
      .post(`/products/${productId}/inquiries`)
      .set('x-mock-user', JSON.stringify({ id: mockUserId }))
      .send({
        title: '비밀 문의',
        content: '비밀 내용입니다.',
        isSecret: true,
      })
      .expect(201);

    const body = res.body as {
      id: string;
      title: string;
      content: string;
      productId: string;
      isSecret: boolean;
    };

    inquiryId = body.id;
    expect(body.isSecret).toBe(true);
    expect(body.productId).toBe(productId);
  });

  it('/products/:id/inquiries (GET) 비밀글 조회 (작성자 → ✅ 허용)', async () => {
    const res: Response = await request(server)
      .get(`/products/${productId}/inquiries`)
      .set('x-mock-user', JSON.stringify({ id: mockUserId }))
      .expect(200);

    const body = res.body as {
      id: string;
      title: string;
      isSecret: boolean;
    }[];

    expect(body.find((inq) => inq.id === inquiryId)).toBeTruthy();
  });

  it('/products/:id/inquiries (GET) 비밀글 조회 (판매자 → ✅ 허용)', async () => {
    const res: Response = await request(server)
      .get(`/products/${productId}/inquiries`)
      .set('x-mock-user', JSON.stringify({ id: mockSellerId })) // ✅ 판매자 유저 ID
      .expect(200);

    const body = res.body as { id: string; title: string; isSecret: boolean }[];
    expect(body.find((inq) => inq.id === inquiryId)).toBeTruthy();
  });

  it('/products/:id/inquiries (GET) 비밀글 조회 (다른 구매자 → ❌ 403)', async () => {
    const anotherUser = 'test_other_buyer';
    await prisma.user.upsert({
      where: { id: anotherUser },
      update: {},
      create: {
        id: anotherUser,
        email: 'other@test.com',
        nickname: '다른구매자',
        passwordHash: 'hash',
        type: 'BUYER',
      },
    });

    await request(server)
      .get(`/products/${productId}/inquiries`)
      .set('x-mock-user', JSON.stringify({ id: anotherUser }))
      .expect(403);
  });

  it('/products/:id (DELETE) 상품 삭제', async () => {
    await request(server)
      .delete(`/products/${productId}`)
      .set('x-mock-user', JSON.stringify({ id: mockSellerId })) // ✅ 판매자 유저 ID
      .expect(204);

    await request(server).get(`/products/${productId}`).expect(404);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });
});
