import { PrismaClient, UserType } from '@prisma/client';
import {
  addDays,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  subYears,
} from 'date-fns';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.user.deleteMany(),
    prisma.store.deleteMany(),
    prisma.category.deleteMany(),
    prisma.stockSize.deleteMany(),
    prisma.product.deleteMany(),
    prisma.order.deleteMany(),
    prisma.stock.deleteMany(),
    prisma.review.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  // 1. 판매자 사용자 생성 (대시보드 테스트용)
  const hash = await bcrypt.hash('pass1234', 10);
  const seller = await prisma.user.upsert({
    where: { id: 'test_seller_id' },
    update: {
      passwordHash: hash,
    },
    create: {
      id: 'test_seller_id',
      email: 'test-seller@example.com',
      type: UserType.SELLER,
      name: 'TestSeller',
      passwordHash: hash,
    },
  });

  // 2. 상점 생성
  const store = await prisma.store.upsert({
    where: { id: 'test_store_id' },
    update: {},
    create: {
      id: 'test_store_id',
      name: 'TestStore',
      address: 'TestAddress',
      detailAddress: 'TestDetailAddress',
      phoneNumber: 'TestPhoneNumber',
      content: 'TestContent',
      image: 'TestImage',
      sellerId: seller.id,
    },
  });

  // 3. 카테고리 생성 (예: TOP)
  const category = await prisma.category.upsert({
    where: { id: 'test_category_id' },
    update: {},
    create: {
      id: 'test_category_id',
      name: 'TOP',
    },
  });

  // 4. 사이즈 생성 (예: M, L 등)
  const sizes = await Promise.all([
    prisma.stockSize.upsert({
      where: { id: 'test_size_m_id' },
      update: {},
      create: { id: 'test_size_m_id', name: 'M' },
    }),
    prisma.stockSize.upsert({
      where: { id: 'test_size_l_id' },
      update: {},
      create: { id: 'test_size_l_id', name: 'L' },
    }),
  ]);

  // 5. 다양한 가격대의 제품 생성 (상위 판매 및 가격 범위 테스트용)
  // - 제품 1: 5,000원 (만원 이하)
  // - 제품 2: 15,000원 (1~2만 원)
  // - 제품 3: 25,000원 (2~3만 원)
  // - 제품 4: 40,000원 (3~5만 원)
  // - 제품 5: 60,000원 (5~7만 원)
  // - 제품 6: 80,000원 (7~10만 원)
  // - 제품 7: 120,000원 (10~15만 원)
  // - 제품 8: 180,000원 (15~20만 원)
  // - 제품 9: 250,000원 (20~30만 원)
  // - 제품 10: 350,000원 (30~40만 원)
  // - 제품 11: 450,000원 (40~50만 원)
  // - 제품 12: 600,000원 (50만 원 이상)
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'test_product_1_id' },
      update: {},
      create: {
        id: 'test_product_1_id',
        name: 'Product 1 (5k)',
        content: 'Test Product 1',
        image: 'test_image_1',
        price: 5000,
        discountPrice: 4000,
        discountRate: 20,
        discountStartTime: new Date('2025-09-01'),
        discountEndTime: new Date('2025-09-30'),
        storeId: store.id,
        categoryId: 'test_category_id',
      },
    }),
    prisma.product.upsert({
      where: { id: 'test_product_2_id' },
      update: {},
      create: {
        id: 'test_product_2_id',
        name: 'Product 2 (15k)',
        content: 'Test Product 2',
        image: 'test_image_2',
        price: 15000,
        discountPrice: 12000,
        discountRate: 20,
        discountStartTime: new Date('2025-09-01'),
        discountEndTime: new Date('2025-09-30'),
        storeId: store.id,
        categoryId: category.id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'test_product_3_id' },
      update: {},
      create: {
        id: 'test_product_3_id',
        name: 'Product 3 (25k)',
        content: 'Test Product 3',
        image: 'test_image_3',
        price: 25000,
        discountPrice: 20000,
        discountRate: 20,
        discountStartTime: new Date('2025-09-01'),
        discountEndTime: new Date('2025-09-30'),
        storeId: store.id,
        categoryId: category.id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'test_product_4_id' },
      update: {},
      create: {
        id: 'test_product_4_id',
        name: 'Product 4 (40k)',
        content: 'Test Product 4',
        image: 'test_image_4',
        price: 40000,
        discountPrice: 32000,
        discountRate: 20,
        discountStartTime: new Date('2025-09-01'),
        discountEndTime: new Date('2025-09-30'),
        storeId: store.id,
        categoryId: category.id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'test_product_5_id' },
      update: {},
      create: {
        id: 'test_product_5_id',
        name: 'Product 5 (60k)',
        content: 'Test Product 5',
        image: 'test_image_5',
        price: 60000,
        discountPrice: 48000,
        discountRate: 20,
        discountStartTime: new Date('2025-09-01'),
        discountEndTime: new Date('2025-09-30'),
        storeId: store.id,
        categoryId: category.id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'test_product_6_id' },
      update: {},
      create: {
        id: 'test_product_6_id',
        name: 'Product 6 (80k)',
        content: 'Test Product 6',
        image: 'test_image_6',
        price: 80000,
        discountPrice: 64000,
        discountRate: 20,
        discountStartTime: new Date('2025-09-01'),
        discountEndTime: new Date('2025-09-30'),
        storeId: store.id,
        categoryId: category.id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'test_product_7_id' },
      update: {},
      create: {
        id: 'test_product_7_id',
        name: 'Product 7 (120k)',
        content: 'Test Product 7',
        image: 'test_image_7',
        price: 120000,
        discountPrice: 96000,
        discountRate: 20,
        discountStartTime: new Date('2025-09-01'),
        discountEndTime: new Date('2025-09-30'),
        storeId: store.id,
        categoryId: category.id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'test_product_8_id' },
      update: {},
      create: {
        id: 'test_product_8_id',
        name: 'Product 8 (180k)',
        content: 'Test Product 8',
        image: 'test_image_8',
        price: 180000,
        discountPrice: 144000,
        discountRate: 20,
        discountStartTime: new Date('2025-09-01'),
        discountEndTime: new Date('2025-09-30'),
        storeId: store.id,
        categoryId: category.id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'test_product_9_id' },
      update: {},
      create: {
        id: 'test_product_9_id',
        name: 'Product 9 (250k)',
        content: 'Test Product 9',
        image: 'test_image_9',
        price: 250000,
        discountPrice: 200000,
        discountRate: 20,
        discountStartTime: new Date('2025-09-01'),
        discountEndTime: new Date('2025-09-30'),
        storeId: store.id,
        categoryId: category.id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'test_product_10_id' },
      update: {},
      create: {
        id: 'test_product_10_id',
        name: 'Product 10 (350k)',
        content: 'Test Product 10',
        image: 'test_image_10',
        price: 350000,
        discountPrice: 280000,
        discountRate: 20,
        discountStartTime: new Date('2025-09-01'),
        discountEndTime: new Date('2025-09-30'),
        storeId: store.id,
        categoryId: category.id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'test_product_11_id' },
      update: {},
      create: {
        id: 'test_product_11_id',
        name: 'Product 11 (450k)',
        content: 'Test Product 11',
        image: 'test_image_11',
        price: 450000,
        discountPrice: 360000,
        discountRate: 20,
        discountStartTime: new Date('2025-09-01'),
        discountEndTime: new Date('2025-09-30'),
        storeId: store.id,
        categoryId: category.id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'test_product_12_id' },
      update: {},
      create: {
        id: 'test_product_12_id',
        name: 'Product 12 (600k)',
        content: 'Test Product 12',
        image: 'test_image_12',
        price: 600000,
        discountPrice: 480000,
        discountRate: 20,
        discountStartTime: new Date('2025-09-01'),
        discountEndTime: new Date('2025-09-30'),
        storeId: store.id,
        categoryId: category.id,
      },
    }),
  ]);

  // 6. 각 제품에 재고 추가 (M 사이즈로 간단히)
  await Promise.all(
    products.map((product) =>
      prisma.stock.upsert({
        where: { id: `test_stock_${product.id}` },
        update: {},
        create: {
          id: `test_stock_${product.id}`,
          productId: product.id,
          sizeId: sizes[0].id, // M 사이즈
          quantity: 100, // 충분한 재고
        },
      }),
    ),
  );

  // 7. 구매자 생성 (주문 생성용)
  const buyer = await prisma.user.upsert({
    where: { id: 'test_buyer_id' },
    update: {},
    create: {
      id: 'test_buyer_id',
      email: 'test-buyer@example.com',
      type: UserType.BUYER,
      name: 'TestBuyer',
      passwordHash: hash,
    },
  });

  // 8. 다양한 기간의 주문 생성 (완료된 결제 상태)
  // 현재 날짜 기준: 2025-09-30
  const now = new Date('2025-09-30');

  // - 오늘 (2025-09-30): 3 주문
  // - 어제 (2025-09-29): 2 주문
  // - 이번 주 (2025-09-23 ~ 2025-09-29): 추가 4 주문
  // - 지난 주: 3 주문
  // - 이번 달 (2025-09-01 ~ 2025-09-30): 추가 5 주문
  // - 지난 달: 4 주문
  // - 올해 (2025-01-01 ~ 2025-09-30): 추가 6 주문
  // - 작년: 5 주문

  // 상위 판매 테스트: 제품 1~5를 더 많이 판매되도록 (제품1: 10회, 제품2: 8회, ... 감소)
  // 가격 범위: 각 범위에 최소 1~2 주문

  await prisma.order.deleteMany({});
  const createOrder = async (
    date: Date,
    productIndices: number[],
    quantities: number[],
  ) => {
    const items = productIndices.map((idx, i) => ({
      productId: products[idx - 1].id,
      quantity: quantities[i],
      price: products[idx - 1].price * quantities[i],
    }));
    const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

    return prisma.order.create({
      data: {
        id: `test_order_${date.toISOString()}_${Math.random().toString(36).slice(2)}`,
        userId: buyer.id,
        storeId: store.id,
        totalPrice,
        status: 'COMPLETEDPAYMENT',
        createdAt: date,
        recipientName: 'TestBuyer',
        recipientPhone: '01012345678',
        address: 'Test Address',
        subtotal: totalPrice,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        items: {
          create: items.map((item) => ({
            id: `test_orderitem_${date.toISOString()}_${item.productId}`,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });
  };

  // 오늘 주문 (3개: 제품1,2,3)
  await createOrder(now, [1, 2], [2, 1]); // 제품1:2, 제품2:1
  await createOrder(addDays(now, 0), [3, 4], [3, 1]); // 제품3:3, 제품4:1
  await createOrder(addDays(now, 0), [5], [4]); // 제품5:4

  // 어제 주문 (2개: 제품1,6)
  await createOrder(subDays(now, 1), [1, 6], [1, 2]);
  await createOrder(subDays(now, 1), [7], [1]);

  // 이번 주 추가 (4개: 과거 날짜)
  await createOrder(subDays(now, 3), [8, 9], [1, 1]);
  await createOrder(subDays(now, 4), [10], [2]);
  await createOrder(subDays(now, 5), [11, 12], [1, 1]);
  await createOrder(subDays(now, 6), [1, 2, 3], [2, 2, 1]);

  // 지난 주 (3개)
  await createOrder(subWeeks(now, 1), [4, 5], [1, 1]);
  await createOrder(addDays(subWeeks(now, 1), -1), [6], [3]);
  await createOrder(addDays(subWeeks(now, 1), -2), [7, 8], [1, 1]);

  // 이번 달 추가 (5개)
  await createOrder(subDays(now, 10), [9, 10], [1, 2]);
  await createOrder(subDays(now, 15), [11], [1]);
  await createOrder(subDays(now, 20), [12, 1], [1, 3]);
  await createOrder(subDays(now, 25), [2, 3], [2, 2]);
  await createOrder(subDays(now, 28), [4], [1]);

  // 지난 달 (4개)
  await createOrder(subMonths(now, 1), [5, 6], [2, 1]);
  await createOrder(addDays(subMonths(now, 1), -5), [7], [1]);
  await createOrder(addDays(subMonths(now, 1), -10), [8, 9], [1, 1]);
  await createOrder(addDays(subMonths(now, 1), -15), [10], [2]);

  // 올해 추가 (6개)
  await createOrder(subMonths(now, 2), [11, 12], [1, 1]);
  await createOrder(subMonths(now, 3), [1, 2, 3], [3, 2, 1]);
  await createOrder(subMonths(now, 4), [4, 5], [1, 2]);
  await createOrder(subMonths(now, 5), [6], [1]);
  await createOrder(subMonths(now, 6), [7, 8], [2, 1]);
  await createOrder(subMonths(now, 7), [9], [1]);

  // 작년 (5개)
  await createOrder(subYears(now, 1), [10, 11], [1, 1]);
  await createOrder(addMonths(subYears(now, 1), -1), [12], [2]);
  await createOrder(addMonths(subYears(now, 1), -2), [1, 2], [1, 1]);
  await createOrder(addMonths(subYears(now, 1), -3), [3, 4], [2, 1]);
  await createOrder(addMonths(subYears(now, 1), -4), [5], [3]);

  // 상위 판매를 위해 추가 주문 (제품1을 가장 많이: 총 10+ 회 주문)
  // 이미 위에서 분산되었으니, 필요시 추가

  console.log('Test seed data created for dashboard API testing!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
