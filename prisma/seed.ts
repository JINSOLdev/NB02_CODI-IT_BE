// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 DB 초기화 시작...');

  // 삭제 순서 (외래키 제약 고려)
  await prisma.answer.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.pointTransaction.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.favoriteStore.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.stockSize.deleteMany();
  await prisma.session.deleteMany();

  console.log('✅ 기존 데이터 삭제 완료');

  // 1. 판매자 User
  await prisma.user.create({
    data: {
      id: '판매자CUID',
      nickname: '스토어주인',
      email: 'owner@test.com',
      passwordHash: 'hashed-password',
      type: 'SELLER',
      gradeLevel: 'GREEN',
    },
  });

  // 2. 구매자 User
  await prisma.user.create({
    data: {
      id: '구매자CUID',
      nickname: '테스트구매자',
      email: 'buyer@test.com',
      passwordHash: 'hashed-password',
      type: 'BUYER',
      gradeLevel: 'GREEN',
    },
  });

  // 3. Store
  await prisma.store.create({
    data: {
      id: '스토어CUID',
      name: '테스트 스토어',
      address: '서울시 강남구',
      detailAddress: '101호',
      phoneNumber: '010-0000-0000',
      content: '테스트 스토어 설명',
      sellerId: '판매자CUID',
    },
  });

  // 4. Category
  await prisma.category.create({
    data: {
      id: '카테고리CUID',
      name: 'TOP',
    },
  });

  // 5. StockSize
  await prisma.stockSize.create({
    data: {
      id: '사이즈CUID',
      name: 'M',
    },
  });

  console.log('✅ 테스트용 Seed 데이터 추가 완료');
}

async function run(): Promise<void> {
  try {
    await main();
  } finally {
    await prisma.$disconnect();
  }
}

// ✅ 안전하게 에러 핸들링
run().catch((e) => {
  console.error('❌ 시드 실행 중 오류 발생:', e);
  process.exit(1);
});

export {};
