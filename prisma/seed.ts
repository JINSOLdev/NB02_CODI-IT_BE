import { PrismaClient, UserType } from '@prisma/client';

const prisma = new PrismaClient();

async function main(){

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

  await prisma.stockSize.upsert({
    where: { id: 'dev_size_id' },
    update: {},
    create: {
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
