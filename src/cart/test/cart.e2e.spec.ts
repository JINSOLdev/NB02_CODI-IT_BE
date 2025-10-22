import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { ParseCuidPipe } from 'src/common/pipes/parse-cuid.pipe';
import { Server } from 'http';
describe('장바구니 통합 테스트', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let Authorization: string;
  let productId: string;
  let sizeId: string;
  let cartItemId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [ParseCuidPipe],
    }).compile();

    app = module.createNestApplication();
    prisma = module.get(PrismaService);
    await app.init();

    // 테스트 전에 데이터베이스 초기화
    await prisma.$transaction([
      prisma.cartItem.deleteMany(),
      prisma.cart.deleteMany(),
      prisma.orderItem.deleteMany(),
      prisma.order.deleteMany(),
      prisma.product.deleteMany(),
      prisma.stock.deleteMany(),
      prisma.stockSize.deleteMany(),
      prisma.category.deleteMany(),
      prisma.store.deleteMany(),
      prisma.user.deleteMany(),
    ]);
    // 테스트용 사용자 생성
    await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'test',
        passwordHash: await bcrypt.hash('Test1234!', 10),
      },
    });
    const response = await request(app.getHttpServer() as Server)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test1234!',
      });
    const body = response.body as { accessToken: string };
    if (!body.accessToken) {
      throw new Error('Access token not found');
    }
    // 인증용 토큰 저장
    Authorization = body.accessToken;

    // 테스트용 판매자 생성
    const seller = await prisma.user.create({
      data: {
        email: 'test-seller@example.com',
        name: 'test-seller',
        passwordHash: await bcrypt.hash('Test1234!', 10),
        type: 'SELLER',
      },
    });
    // 테스트용 상점 생성
    const store = await prisma.store.create({
      data: {
        name: 'test',
        address: 'test',
        detailAddress: 'test',
        phoneNumber: 'test',
        content: 'test',
        image: 'test',
        seller: {
          connect: {
            id: seller.id,
          },
        },
      },
    });
    // 테스트용 카테고리 생성
    const category = await prisma.category.create({
      data: {
        name: 'TOP',
      },
    });
    // 테스트용 상품 생성
    const product = await prisma.product.create({
      data: {
        name: 'test',
        price: 10000,
        content: 'test',
        image: 'test',
        store: {
          connect: {
            id: store.id,
          },
        },
        category: {
          connect: {
            id: category.id,
          },
        },
      },
    });
    const size = await prisma.stockSize.create({
      data: {
        name: 'M',
      },
    });
    sizeId = size.id;
    productId = product.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('장바구니 생성', () => {
    it('장바구니 생성', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/cart')
        .set('Authorization', `Bearer ${Authorization}`)
        .send();
      expect(response.statusCode).toBe(201);
    });

    it('장바구니 생성 실패(인증토큰 없음)', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/cart')
        .send();
      expect(response.statusCode).toBe(401);
    });
  });

  describe('장바구니 수정', () => {
    it('장바구니 수정', async () => {
      const response = await request(app.getHttpServer() as Server)
        .patch(`/api/cart`)
        .set('Authorization', `Bearer ${Authorization}`)
        .send({
          productId,
          sizes: [
            {
              sizeId,
              quantity: 1,
            },
          ],
        });
      expect(response.statusCode).toBe(200);
      const body = response.body as { items: { id: string }[] };
      console.log(body, productId, sizeId);
      cartItemId = body.items[0].id;
    });

    it('장바구니 수정 실패(인증토큰 없음)', async () => {
      const response = await request(app.getHttpServer() as Server)
        .patch(`/api/cart`)
        .send({
          productId,
          sizes: [
            {
              sizeId,
              quantity: 1,
            },
          ],
        });
      expect(response.statusCode).toBe(401);
    });
  });

  describe('장바구니 조회', () => {
    it('장바구니 조회', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/api/cart`)
        .set('Authorization', `Bearer ${Authorization}`)
        .send();
      expect(response.statusCode).toBe(200);
    });

    it('장바구니 조회 실패(인증토큰 없음)', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/api/cart`)
        .send();
      expect(response.statusCode).toBe(401);
    });
  });

  describe('장바구니 아이템 조회', () => {
    it('장바구니 아이템 조회', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/api/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${Authorization}`)
        .send();
      expect(response.statusCode).toBe(200);
    });

    it('장바구니 아이템 조회 실패(인증토큰 없음)', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/api/cart/${cartItemId}`)
        .send();
      expect(response.statusCode).toBe(401);
    });

    it('장바구니 아이템 조회 실패(없는 아이템)', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/api/cart/notExist`)
        .set('Authorization', `Bearer ${Authorization}`)
        .send();
      expect(response.statusCode).toBe(404);
    });
  });

  describe('장바구니 아이템 삭제', () => {
    it('장바구니 아이템 삭제', async () => {
      const response = await request(app.getHttpServer() as Server)
        .delete(`/api/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${Authorization}`)
        .send();
      expect(response.statusCode).toBe(200);
    });

    it('장바구니 아이템 삭제 실패(인증토큰 없음)', async () => {
      const response = await request(app.getHttpServer() as Server)
        .delete(`/api/cart/${cartItemId}`)
        .send();
      expect(response.statusCode).toBe(401);
    });

    it('장바구니 아이템 삭제 실패(없는 아이템)', async () => {
      const response = await request(app.getHttpServer() as Server)
        .delete(`/api/cart/notExist`)
        .set('Authorization', `Bearer ${Authorization}`)
        .send();
      expect(response.statusCode).toBe(404);
    });
  });
});
