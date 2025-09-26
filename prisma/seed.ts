// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. 테스트용 User (스토어 주인)
  await prisma.user.upsert({
    where: { id: '사용자CUID' },
    update: {},
    create: {
      id: '사용자CUID',
      nickname: '스토어주인',
      email: 'owner@test.com',
      passwordHash: 'hashed-password',
      type: 'SELLER',
      gradeLevel: 'GREEN',
    },
  });

  // 2. 테스트용 Store (User 연결)
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
      sellerId: '사용자CUID', // ✅ 필수 관계
    },
  });

  // 3. 테스트용 Category
  await prisma.category.upsert({
    where: { id: '카테고리CUID' },
    update: {},
    create: {
      id: '카테고리CUID',
      name: 'TOP',
    },
  });

  // 4. 테스트용 StockSize
  await prisma.stockSize.upsert({
    where: { id: '사이즈CUID' },
    update: {},
    create: {
      id: '사이즈CUID',
      name: 'M',
    },
  });

  console.log('✅ 테스트용 Seed 데이터가 성공적으로 추가되었습니다.');
}

void main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    // ✅ ESLint 경고 방지
    void prisma.$disconnect();
  });

export {};
