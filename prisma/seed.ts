import { PrismaClient, UserType, CategoryType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 DB 초기화 시작...');

  // ✅ 유저 생성
  await prisma.user.upsert({
    where: { id: 'test_seller_id' },
    update: {},
    create: {
      id: 'test_seller_id',
      email: 'seller@test.com',
      nickname: '판매자',
      passwordHash: 'hashed-password',
      type: UserType.SELLER,
    },
  });

  await prisma.user.upsert({
    where: { id: 'test_buyer_id' },
    update: {},
    create: {
      id: 'test_buyer_id',
      email: 'buyer@test.com',
      nickname: '구매자',
      passwordHash: 'hashed-password',
      type: UserType.BUYER,
    },
  });

  // ✅ 스토어 생성
  await prisma.store.upsert({
    where: { id: 'test_store_id' },
    update: {},
    create: {
      id: 'test_store_id',
      name: '테스트 스토어',
      sellerId: 'test_seller_id',
      content: '테스트 스토어 설명',
      address: '서울시 강남구',
      detailAddress: '101호',
      phoneNumber: '010-1234-5678',
    },
  });

  // ✅ 카테고리 생성 (name 기준 upsert)
  const categories: CategoryType[] = [
    CategoryType.TOP,
    CategoryType.BOTTOM,
    CategoryType.DRESS,
    CategoryType.OUTER,
    CategoryType.SKIRT,
    CategoryType.SHOES,
    CategoryType.ACC,
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name }, // 🔥 unique 필드 name으로 검색
      update: {},
      create: {
        id: `test_category_${name.toLowerCase()}`,
        name,
      },
    });
  }

  // ✅ StockSize 고정 ID (프론트에서 1~6 숫자 매핑 그대로 사용 가능)
  const stockSizes = [
    { id: '1', name: 'XS' },
    { id: '2', name: 'S' },
    { id: '3', name: 'M' },
    { id: '4', name: 'L' },
    { id: '5', name: 'XL' },
    { id: '6', name: 'FREE' },
  ];

  for (const size of stockSizes) {
    await prisma.stockSize.upsert({
      where: { id: size.id }, // 🔥 id 고정
      update: {},
      create: { id: size.id, name: size.name },
    });
  }

  console.log('✅ Seed 완료!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
