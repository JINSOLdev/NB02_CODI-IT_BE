import { PrismaClient, UserType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  //모든 데이터 제거
  await prisma.$transaction([
    prisma.user.deleteMany(),
    prisma.store.deleteMany(),
    prisma.category.deleteMany(),
    prisma.product.deleteMany(),
    prisma.stock.deleteMany(),
    prisma.stockSize.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.review.deleteMany(),
    prisma.inquiry.deleteMany(),
    prisma.answer.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.pointTransaction.deleteMany(),
    prisma.favoriteStore.deleteMany(),
  ]);

  // dev용 판매자 생성 (DevAuthGuard와 맞추기 위해 id 고정)
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

  console.log(`Seeded! SELLER: dev_seller_id, BUYER: dev_buyer_id}`);

  await prisma.category.create({
    data: {
      id: 'dev_category_id',
      name: 'TOP',
    },
  });

  await prisma.store.create({
    data: {
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

  await prisma.product.create({
    data: {
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

  await prisma.stock.create({
    data: {
      id: 'dev_stock_id',
      productId: 'dev_product_id',
      sizeId: 'dev_size_id',
      quantity: 10,
    },
  });

  await prisma.stockSize.create({
    data: {
      id: 'dev_size_id',
      name: 'DevSize',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
