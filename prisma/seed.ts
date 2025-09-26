// prisma/seed.ts
import { PrismaClient, UserType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 DB 초기화 시작...');

  // ✅ 공통: 판매자/구매자 (테스트용)
  await prisma.user.upsert({
    where: { id: '판매자CUID' },
    update: {},
    create: {
      id: '판매자CUID',
      nickname: '스토어주인',
      email: 'owner@test.com',
      passwordHash: 'hashed-password',
      type: UserType.SELLER,
    },
  });

  await prisma.user.upsert({
    where: { id: '구매자CUID' },
    update: {},
    create: {
      id: '구매자CUID',
      nickname: '테스트구매자',
      email: 'buyer@test.com',
      passwordHash: 'hashed-password',
      type: UserType.BUYER,
    },
  });

  await prisma.store.upsert({
    where: { id: '스토어CUID' },
    update: {},
    create: {
      id: '스토어CUID',
      name: '테스트 스토어',
      address: '서울시 강남구',
      detailAddress: '101호',
      phoneNumber: '010-0000-0000',
      content: '테스트 스토어 설명',
      sellerId: '판매자CUID',
    },
  });

  await prisma.category.upsert({
    where: { id: '카테고리CUID' },
    update: {},
    create: {
      id: '카테고리CUID',
      name: 'TOP',
    },
  });

  await prisma.stockSize.upsert({
    where: { id: '사이즈CUID' },
    update: {},
    create: {
      id: '사이즈CUID',
      name: 'M',
    },
  });

  // ✅ dev 전용 시드
  await prisma.user.upsert({
    where: { id: 'dev_seller_id' },
    update: {},
    create: {
      id: 'dev_seller_id',
      email: 'dev-seller@example.com',
      type: UserType.SELLER,
      nickname: 'DevSeller',
      passwordHash: 'dev-hash',
    },
  });

  await prisma.user.upsert({
    where: { id: 'dev_buyer_id' },
    update: {},
    create: {
      id: 'dev_buyer_id',
      email: 'dev-buyer@example.com',
      type: UserType.BUYER,
      nickname: 'DevBuyer',
      passwordHash: 'dev-hash',
    },
  });

  await prisma.category.upsert({
    where: { id: 'dev_category_id' },
    update: {},
    create: {
      id: 'dev_category_id',
      name: 'TOP',
    },
  });

  await prisma.store.upsert({
    where: { id: 'dev_store_id' },
    update: {},
    create: {
      id: 'dev_store_id',
      name: 'DevStore',
      address: 'DevAddress',
      detailAddress: 'DevDetailAddress',
      phoneNumber: 'DevPhoneNumber',
      content: 'DevContent',
      image: 'DevImage',
      sellerId: 'dev_seller_id',
    },
  });

  await prisma.product.upsert({
    where: { id: 'dev_product_id' },
    update: {},
    create: {
      id: 'dev_product_id',
      name: 'DevProduct',
      content: 'DevProductContent',
      image: 'DevProductImage',
      price: 10000,
      discountPrice: 8000,
      discountRate: 20,
      discountStartTime: new Date(),
      discountEndTime: new Date(),
      sales: 0,
      storeId: 'dev_store_id',
      categoryId: 'dev_category_id',
    },
  });

  await prisma.stockSize.upsert({
    where: { id: 'dev_size_id' },
    update: {},
    create: {
      id: 'dev_size_id',
      name: 'DevSize',
    },
  });

  await prisma.stock.upsert({
    where: { id: 'dev_stock_id' },
    update: {},
    create: {
      id: 'dev_stock_id',
      productId: 'dev_product_id',
      sizeId: 'dev_size_id',
      quantity: 10,
    },
  });

  console.log('✅ Seeded 완료! (테스트 + dev 데이터)');
}

async function run(): Promise<void> {
  try {
    await main();
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((e) => {
  console.error('❌ 시드 실행 중 오류 발생:', e);
  process.exit(1);
});

export {};
