import { PrismaClient, UserType, CategoryType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 DB 초기화 시작...');

  const hashedPassword = await bcrypt.hash('pass1234', 10);

  // ✅ 유저
  await prisma.user.upsert({
    where: { id: 'test_seller_id' },
    update: {},
    create: {
      id: 'test_seller_id',
      email: 'seller@test.com',
      nickname: '판매자',
      passwordHash: hashedPassword,
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
      passwordHash: hashedPassword,
      type: UserType.BUYER,
    },
  });

  // ✅ 스토어
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

  // ✅ 카테고리 (초기화 후 재생성)
  await prisma.category.deleteMany();

  const categories: CategoryType[] = [
    CategoryType.TOP,
    CategoryType.BOTTOM,
    CategoryType.DRESS,
    CategoryType.OUTER,
    CategoryType.SKIRT,
    CategoryType.SHOES,
    CategoryType.ACC,
  ];

  await prisma.category.createMany({
    data: categories.map((name) => ({
      id: `test_category_${name.toLowerCase()}`,
      name,
    })),
  });

  // ✅ 사이즈
  await prisma.stockSize.deleteMany();

  const stockSizes = [
    { id: '1', name: 'XS' },
    { id: '2', name: 'S' },
    { id: '3', name: 'M' },
    { id: '4', name: 'L' },
    { id: '5', name: 'XL' },
    { id: '6', name: 'FREE' },
  ];

  await prisma.stockSize.createMany({ data: stockSizes });

  // ✅ 상품
  await prisma.product.createMany({
    data: [
      {
        id: 'cabc1234-5678-90ab-cdef-1234567890ab',
        name: '테스트 상품 1',
        price: 25000,
        discountRate: 0,
        discountPrice: 25000,
        categoryId: 'test_category_top',
        storeId: 'test_store_id',
        image: null,
        content: '테스트용 상품입니다.',
      },
      {
        id: 'dabc1234-5678-90ab-cdef-1234567890ac',
        name: '테스트 상품 2',
        price: 23000,
        discountRate: 8,
        discountPrice: 21160,
        categoryId: 'test_category_bottom',
        storeId: 'test_store_id',
        image: null,
        content: '테스트용 상품입니다.',
      },
    ],
  });

  console.log('✅ Seed 완료!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ 시드 실행 중 오류:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
