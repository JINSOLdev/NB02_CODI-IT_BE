/* eslint-disable no-console */
import {
  PrismaClient,
  NotificationType,
  CategoryType,
  UserType,
} from '@prisma/client';

const prisma = new PrismaClient();
const iso = (s: string) => new Date(s);

// ▼ 대상 유저 (캡쳐 기준)
const SELLER_EMAIL = 'aaa@gmail.com';
const BUYER1_EMAIL = 'hhh@gmail.com';
const BUYER2_EMAIL = 'bbb@gmail.com';

async function ensureUsers() {
  const seller = await prisma.user.findUnique({
    where: { email: SELLER_EMAIL },
  });
  if (!seller || seller.type !== UserType.SELLER) {
    throw new Error(`SELLER '${SELLER_EMAIL}' 가 없거나 SELLER 타입이 아님`);
  }

  const buyer1 = await prisma.user.findUnique({
    where: { email: BUYER1_EMAIL },
  });
  const buyer2 = await prisma.user.findUnique({
    where: { email: BUYER2_EMAIL },
  });
  if (!buyer1 || buyer1.type !== UserType.BUYER)
    throw new Error(`BUYER '${BUYER1_EMAIL}' 없음`);
  if (!buyer2 || buyer2.type !== UserType.BUYER)
    throw new Error(`BUYER '${BUYER2_EMAIL}' 없음`);

  const store = await prisma.store.findUnique({
    where: { sellerId: seller.id },
  });
  if (!store) throw new Error(`'${SELLER_EMAIL}' 의 스토어가 아직 없음`);

  return { seller, buyer1, buyer2, store };
}

async function ensureCategories() {
  const top = await prisma.category.upsert({
    where: { name: CategoryType.TOP },
    update: {},
    create: { name: CategoryType.TOP },
  });
  const bottom = await prisma.category.upsert({
    where: { name: CategoryType.BOTTOM },
    update: {},
    create: { name: CategoryType.BOTTOM },
  });
  return { top, bottom };
}

async function ensureProducts(
  storeId: string,
  topId: string,
  bottomId: string,
) {
  let p1 = await prisma.product.findFirst({
    where: { storeId, name: 'AAA 상품 1' },
  });
  if (!p1) {
    p1 = await prisma.product.create({
      data: {
        name: 'AAA 상품 1',
        price: 25000,
        discountRate: 0,
        discountPrice: 25000,
        categoryId: topId,
        storeId,
        content: '알림 테스트용 상품 1',
      },
    });
  }
  let p2 = await prisma.product.findFirst({
    where: { storeId, name: 'AAA 상품 2' },
  });
  if (!p2) {
    p2 = await prisma.product.create({
      data: {
        name: 'AAA 상품 2',
        price: 30000,
        discountRate: 10,
        discountPrice: 27000,
        categoryId: bottomId,
        storeId,
        content: '알림 테스트용 상품 2',
      },
    });
  }
  return { p1, p2 };
}

async function ensureOrderAndInquiry(
  buyerId: string,
  storeId: string,
  productId: string,
) {
  // 주문 1건 + 주문아이템 1건
  const order = await prisma.order.create({
    data: {
      userId: buyerId,
      storeId,
      recipientName: '수신자',
      recipientPhone: '010-0000-0000',
      address: '서울시 테스트구 1-1',
      subtotal: 25000,
      totalQuantity: 1,
      totalPrice: 25000,
      usePoint: 0,
      items: { create: [{ productId, quantity: 1, price: 25000 }] },
    },
  });

  // 문의 1건
  const inquiry = await prisma.inquiry.create({
    data: {
      title: '사이즈 문의',
      content: 'M 사이즈 재입고 일정 궁금합니다.',
      userId: buyerId,
      productId,
    },
  });

  return { order, inquiry };
}

/* ------------------------ 알림 빌더 (유저타입별) ------------------------ */

function buildSellerNotifications(args: {
  sellerId: string;
  storeId: string;
  p1: string;
  p2: string;
  inquiryId: string;
}) {
  const { sellerId, storeId, p1, p2, inquiryId } = args;
  return [
    // 조회/페이지네이션
    {
      id: 'seller-001',
      userId: sellerId,
      type: NotificationType.NEW_INQUIRY,
      title: '새 문의 도착',
      message: '상품에 새 문의가 등록되었습니다.',
      storeId,
      productId: p1,
      inquiryId,
      isRead: false,
      createdAt: iso('2025-10-29T00:00:00Z'),
      updatedAt: iso('2025-10-29T00:00:00Z'),
    },
    {
      id: 'seller-002',
      userId: sellerId,
      type: NotificationType.OUT_OF_STOCK_SELLER,
      title: '재고 경고',
      message: '상품 재고가 임계치 이하입니다.',
      storeId,
      productId: p2,
      isRead: true,
      readAt: iso('2025-10-29T00:20:00Z'),
      createdAt: iso('2025-10-29T00:20:00Z'),
      updatedAt: iso('2025-10-29T00:20:00Z'),
    },
    {
      id: 'seller-003',
      userId: sellerId,
      type: NotificationType.SYSTEM,
      title: '시스템 공지',
      message: '11/02 02:00–03:00(KST) 점검 예정',
      storeId,
      isRead: false,
      createdAt: iso('2025-10-29T00:40:00Z'),
      updatedAt: iso('2025-10-29T00:40:00Z'),
    },
    // 상태변경 타겟
    {
      id: 'seller-toggle-001',
      userId: sellerId,
      type: NotificationType.OUT_OF_STOCK_SELLER,
      title: '읽음 토글용',
      message: '읽음/안읽음 토글 테스트',
      storeId,
      productId: p1,
      isRead: false,
      createdAt: iso('2025-10-29T01:00:00Z'),
      updatedAt: iso('2025-10-29T01:00:00Z'),
    },
  ];
}

function buildBuyerNotifications(args: {
  buyerId: string;
  storeId: string;
  p1: string;
  p2: string;
  orderId: string;
  inquiryId: string;
  prefix: 'buyer1' | 'buyer2'; // 아이디 충돌 방지
}) {
  const { buyerId, storeId, p1, p2, orderId, inquiryId, prefix } = args;
  return [
    // 조회/페이지네이션
    {
      id: `${prefix}-001`,
      userId: buyerId,
      type: NotificationType.OUT_OF_STOCK_CART,
      title: '장바구니 품절',
      message: '장바구니 상품이 품절되었습니다.',
      productId: p1,
      isRead: false,
      createdAt: iso('2025-10-29T00:05:00Z'),
      updatedAt: iso('2025-10-29T00:05:00Z'),
    },
    {
      id: `${prefix}-002`,
      userId: buyerId,
      type: NotificationType.OUT_OF_STOCK_ORDER,
      title: '주문 처리 중 품절',
      message: '주문 처리 중 일부 품목이 품절되었습니다.',
      productId: p2,
      orderId,
      isRead: false,
      createdAt: iso('2025-10-29T00:25:00Z'),
      updatedAt: iso('2025-10-29T00:25:00Z'),
    },
    {
      id: `${prefix}-003`,
      userId: buyerId,
      type: NotificationType.SYSTEM,
      title: '시스템 알림',
      message: '서비스 안정화가 진행 중입니다.',
      storeId,
      isRead: false,
      createdAt: iso('2025-10-29T00:45:00Z'),
      updatedAt: iso('2025-10-29T00:45:00Z'),
    },
    // 문의 답변 알림
    {
      id: `${prefix}-inquiry-answered-001`,
      userId: buyerId,
      type: NotificationType.INQUIRY_ANSWERED,
      title: '문의 답변 등록',
      message: '문의하신 내용에 답변이 등록되었습니다.',
      productId: p1,
      inquiryId,
      isRead: false,
      createdAt: iso('2025-10-29T00:55:00Z'),
      updatedAt: iso('2025-10-29T00:55:00Z'),
    },
    // 상태변경 타겟
    {
      id: `${prefix}-toggle-001`,
      userId: buyerId,
      type: NotificationType.OUT_OF_STOCK_CART,
      title: '읽음 토글용',
      message: '읽음/안읽음 토글 테스트',
      productId: p2,
      isRead: false,
      createdAt: iso('2025-10-29T01:05:00Z'),
      updatedAt: iso('2025-10-29T01:05:00Z'),
    },
  ];
}

async function main() {
  console.log('🔔 Seeding notifications for SELLER & two BUYERs...');
  const { seller, buyer1, buyer2, store } = await ensureUsers();
  const { top, bottom } = await ensureCategories();
  const { p1, p2 } = await ensureProducts(store.id, top.id, bottom.id);

  // 각 바이어별 주문/문의(서로 다른 참조로 unique 충족)
  const { order: order1, inquiry: inquiry1 } = await ensureOrderAndInquiry(
    buyer1.id,
    store.id,
    p1.id,
  );
  const { order: order2, inquiry: inquiry2 } = await ensureOrderAndInquiry(
    buyer2.id,
    store.id,
    p2.id,
  );

  // 이전 생성분 정리
  await prisma.notification.deleteMany({
    where: {
      id: {
        in: [
          'seller-001',
          'seller-002',
          'seller-003',
          'seller-toggle-001',
          'buyer1-001',
          'buyer1-002',
          'buyer1-003',
          'buyer1-inquiry-answered-001',
          'buyer1-toggle-001',
          'buyer2-001',
          'buyer2-002',
          'buyer2-003',
          'buyer2-inquiry-answered-001',
          'buyer2-toggle-001',
        ],
      },
    },
  });

  // SELLER 알림
  const sellerNotis = buildSellerNotifications({
    sellerId: seller.id,
    storeId: store.id,
    p1: p1.id,
    p2: p2.id,
    inquiryId: inquiry1.id,
  });

  // BUYER 1(hhh) 알림
  const buyer1Notis = buildBuyerNotifications({
    buyerId: buyer1.id,
    storeId: store.id,
    p1: p1.id,
    p2: p2.id,
    orderId: order1.id,
    inquiryId: inquiry1.id,
    prefix: 'buyer1',
  });

  // BUYER 2(bbb) 알림 (서로 다른 참조: order2/inquiry2, 제품도 반대로 사용)
  const buyer2Notis = buildBuyerNotifications({
    buyerId: buyer2.id,
    storeId: store.id,
    p1: p2.id,
    p2: p1.id, // p1/p2 swap
    orderId: order2.id,
    inquiryId: inquiry2.id,
    prefix: 'buyer2',
  });

  await prisma.notification.createMany({
    data: [...sellerNotis, ...buyer1Notis, ...buyer2Notis],
    skipDuplicates: true,
  });

  console.log('✅ DONE: seller & buyer(hhh, bbb) notification seeds created.');
}

main()
  .catch((e) => {
    console.error('❌ Seed 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
