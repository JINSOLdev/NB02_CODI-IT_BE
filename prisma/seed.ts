import { PrismaClient, UserType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // dev용 판매자 생성 (DevAuthGuard와 맞추기 위해 id 고정)
  const user1 = await prisma.user.upsert({
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

  const user2 = await prisma.user.upsert({
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

  console.log(`Seeded! SELLER: ${user1}, BUYER:${user2}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
