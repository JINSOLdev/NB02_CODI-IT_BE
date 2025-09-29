import 'dotenv/config';
import {
  PrismaClient,
  UserType,
  GradeLevel,
  CategoryType,
} from '@prisma/client';
import { DateTime } from 'luxon';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SELLER_EMAIL = process.env.SEED_SELLER_EMAIL ?? 'seller@example.com';
const SELLER_PASSWORD = process.env.SEED_SELLER_PASSWORD ?? 'Seed1234!';
const SELLER_NICK = process.env.SEED_SELLER_NICK ?? '시드판매자';
const STORE_NAME = process.env.SEED_STORE_NAME ?? '시드 스토어';
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

type SeedProduct = {
  name: string;
  content?: string;
  image?: string;
  price: number;
  category: CategoryType;
  discountPrice?: number | null;
  discountRate?: number | null;
  discountStartOffsetDays?: number;
  discountEndOffsetDays?: number;
  stockPlan: Array<{ size: 'FREE' | 'S' | 'M' | 'L'; qty: number }>;
};

async function ensureSellerAndStore() {
  const passwordHash = await bcrypt.hash(SELLER_PASSWORD, SALT_ROUNDS);

  const seller = await prisma.user.upsert({
    where: { email: SELLER_EMAIL },
    update: { passwordHash, type: UserType.SELLER },
    create: {
      email: SELLER_EMAIL,
      nickname: SELLER_NICK,
      passwordHash,
      type: UserType.SELLER,
      gradeLevel: GradeLevel.GREEN,
      points: 0,
    },
  });

  // 스토어 없으면 생성
  let store = await prisma.store.findFirst({ where: { sellerId: seller.id } });
  if (!store) {
    store = await prisma.store.create({
      data: {
        name: STORE_NAME,
        address: '서울시 테스트구',
        detailAddress: '123-456',
        phoneNumber: '010-0000-0000',
        content: '시드 데이터용 스토어입니다.',
        image: 'https://picsum.photos/seed/store/400/300',
        seller: { connect: { id: seller.id } },
      },
    });
  }

  return { seller, store };
}

async function ensureCategories() {
  const map = new Map<CategoryType, string>();
  const all = Object.values(CategoryType) as CategoryType[];
  for (const name of all) {
    let category = await prisma.category.findFirst({ where: { name } });
    if (!category) category = await prisma.category.create({ data: { name } });
    map.set(name, category.id);
  }
  return map;
}

async function ensureStockSizes() {
  const sizeNames = ['FREE', 'S', 'M', 'L'] as const;
  const map = new Map<string, string>(); // sizeName -> sizeId

  for (const name of sizeNames) {
    let size = await prisma.stockSize.findFirst({ where: { name } });
    if (!size) size = await prisma.stockSize.create({ data: { name } });
    map.set(name, size.id);
  }
  return map;
}

function buildProducts(): SeedProduct[] {
  return [
    {
      name: '기본 가디건',
      content: '부드러운 아크릴 혼방 가디건',
      image: 'https://picsum.photos/seed/cardigan/600/600',
      price: 29900,
      category: CategoryType.OUTER,
      discountRate: 10,
      discountStartOffsetDays: -1,
      discountEndOffsetDays: 7,
      stockPlan: [
        { size: 'S', qty: 10 },
        { size: 'M', qty: 15 },
        { size: 'L', qty: 8 },
      ],
    },
    {
      name: '베이식 코튼 티셔츠',
      image: 'https://picsum.photos/seed/tshirt/600/600',
      price: 12900,
      category: CategoryType.TOP,
      stockPlan: [
        { size: 'S', qty: 20 },
        { size: 'M', qty: 25 },
        { size: 'L', qty: 18 },
      ],
    },
    {
      name: '스트레이트 데님 팬츠',
      image: 'https://picsum.photos/seed/jeans/600/600',
      price: 39900,
      category: CategoryType.BOTTOM,
      discountPrice: 34900,
      discountStartOffsetDays: -3,
      discountEndOffsetDays: 3,
      stockPlan: [
        { size: 'S', qty: 12 },
        { size: 'M', qty: 17 },
        { size: 'L', qty: 9 },
      ],
    },
    {
      name: '플레어 원피스',
      image: 'https://picsum.photos/seed/dress/600/600',
      price: 49900,
      category: CategoryType.DRESS,
      stockPlan: [
        { size: 'S', qty: 7 },
        { size: 'M', qty: 10 },
        { size: 'L', qty: 6 },
      ],
    },
    {
      name: 'A라인 스커트',
      image: 'https://picsum.photos/seed/skirt/600/600',
      price: 27900,
      category: CategoryType.SKIRT,
      stockPlan: [
        { size: 'S', qty: 9 },
        { size: 'M', qty: 12 },
        { size: 'L', qty: 8 },
      ],
    },
    {
      name: '데일리 후드티',
      image: 'https://picsum.photos/seed/hoodie/600/600',
      price: 49900,
      category: CategoryType.TOP,
      discountPrice: 39900,
      discountStartOffsetDays: -2,
      discountEndOffsetDays: 10,
      stockPlan: [
        { size: 'S', qty: 14 },
        { size: 'M', qty: 20 },
        { size: 'L', qty: 11 },
      ],
    },
    {
      name: '레더 스니커즈',
      image: 'https://picsum.photos/seed/shoes/600/600',
      price: 59900,
      category: CategoryType.SHOES,
      stockPlan: [
        { size: 'S', qty: 8 },
        { size: 'M', qty: 10 },
        { size: 'L', qty: 7 },
      ],
    },
    {
      name: '니트 비니',
      image: 'https://picsum.photos/seed/beanie/600/600',
      price: 15900,
      category: CategoryType.ACC,
      stockPlan: [{ size: 'FREE', qty: 30 }],
    },
  ];
}

async function createProductWithStocks(opts: {
  storeId: string;
  categoryId: string;
  product: SeedProduct;
  sizeIdMap: Map<string, string>;
}) {
  const { storeId, categoryId, product, sizeIdMap } = opts;

  const now = DateTime.now().setZone('Asia/Seoul');
  const start =
    product.discountStartOffsetDays !== undefined
      ? now.plus({ days: product.discountStartOffsetDays }).toJSDate()
      : null;
  const end =
    product.discountEndOffsetDays !== undefined
      ? now.plus({ days: product.discountEndOffsetDays }).toJSDate()
      : null;

  // Product 생성
  const created = await prisma.product.create({
    data: {
      name: product.name,
      content: product.content ?? null,
      image: product.image ?? null,
      price: product.price,
      discountPrice: product.discountPrice ?? null,
      discountRate: product.discountRate ?? null,
      discountStartTime: start,
      discountEndTime: end,
      store: { connect: { id: storeId } },
      category: { connect: { id: categoryId } },
    },
  });

  // 재고(사이즈별 Stock) 생성
  for (const plan of product.stockPlan) {
    const sizeId = sizeIdMap.get(plan.size);
    if (!sizeId) throw new Error(`StockSize not found: ${plan.size}`);
    await prisma.stock.create({
      data: {
        product: { connect: { id: created.id } },
        size: { connect: { id: sizeId } },
        quantity: plan.qty,
      },
    });
  }
}

async function main() {
  const { seller, store } = await ensureSellerAndStore();
  const categoryMap = await ensureCategories();
  const sizeIdMap = await ensureStockSizes();

  // 기존 상품 삭제(중복 방지)
  await prisma.product.deleteMany({ where: { storeId: store.id } });

  const seeds = buildProducts();

  for (const p of seeds) {
    const categoryId = categoryMap.get(p.category);
    if (!categoryId) throw new Error(`Category not found: ${p.category}`);
    await createProductWithStocks({
      storeId: store.id,
      categoryId,
      product: p,
      sizeIdMap,
    });
  }

  console.log('✅ Seed completed.');
  console.log('   Seller Email:', SELLER_EMAIL);
  console.log('   Seller Password:', SELLER_PASSWORD);
  console.log(`   Store: ${store.name} (${store.id})`);
}

main()
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
