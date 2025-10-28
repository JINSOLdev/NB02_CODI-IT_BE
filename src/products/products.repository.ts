import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Product, Inquiry, CategoryType } from '@prisma/client';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { TransformedStock } from './dto/create-product.dto';

// 🔧 Relation 포함된 타입 정의
export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    store: { select: { name: true } };
    reviews: { select: { rating: true } };
    stocks: { include: { size: true } };
  };
}>;

export type ProductDetailWithRelations = Prisma.ProductGetPayload<{
  include: {
    store: true;
    category: true;
    stocks: { include: { size: true } };
    reviews: true;
    inquiries: true;
  };
}>;

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** ✅ 스토어 ID로 조회 (PK) */
  async findStoreById(storeId: string) {
    return this.prisma.store.findUnique({ where: { id: storeId } });
  }

  /** ✅ 판매자 ID로 스토어 조회 (unique) */
  async findStoreBySellerId(sellerId: string) {
    return this.prisma.store.findUnique({ where: { sellerId } });
  }

  /** ⚙️ 카테고리명으로 카테고리 조회 (name은 unique 아님 → findFirst) */
  async findCategoryByName(name: CategoryType) {
    return this.prisma.category.findFirst({ where: { name } });
  }

  /** ⚙️ 사이즈명으로 사이즈 조회 (unique 아님 → findFirst 유지) */
  async findStockSizeByName(name: string) {
    return this.prisma.stockSize.findFirst({ where: { name } });
  }

  /** ✅ 상품 등록 */
  async create(data: {
    name: string;
    content?: string;
    image?: string;
    price: number;
    discountRate?: number;
    discountPrice?: number;
    discountStartTime?: string;
    discountEndTime?: string;
    storeId: string;
    categoryId: string;
    stocks: TransformedStock[];
  }): Promise<Product> {
    return this.prisma.product.create({
      data: {
        name: data.name,
        content: data.content,
        image: data.image,
        price: data.price,
        discountRate: data.discountRate,
        discountPrice: data.discountPrice,
        discountStartTime: data.discountStartTime
          ? new Date(data.discountStartTime)
          : undefined,
        discountEndTime: data.discountEndTime
          ? new Date(data.discountEndTime)
          : undefined,
        storeId: data.storeId,
        categoryId: data.categoryId,
        stocks: {
          create: data.stocks.map((s) => ({
            sizeId: s.sizeId,
            quantity: s.quantity,
          })),
        },
      },
    });
  }

  /** ✅ 상품 목록 조회 */
  async findAll(query: FindProductsQueryDto): Promise<ProductWithRelations[]> {
    const where: Prisma.ProductWhereInput = {};
    if (query.categoryName) where.category = { name: query.categoryName };
    if (query.search) where.name = { contains: query.search };
    if (query.priceMin) where.price = { gte: query.priceMin };
    if (query.priceMax) where.price = { lte: query.priceMax };
    if (query.size) where.stocks = { some: { size: { name: query.size } } };
    return this.prisma.product.findMany({
      where,
      skip: query.skip,
      take: query.take,
      include: {
        store: { select: { name: true } },
        reviews: { select: { rating: true } },
        stocks: { include: { size: true } },
      },
    });
  }

  /** ✅ 상품 상세 조회 (PK) */
  async findOne(productId: string): Promise<ProductDetailWithRelations | null> {
    return this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        store: true,
        category: true,
        stocks: { include: { size: true } },
        reviews: true,
        inquiries: true,
      },
    });
  }

  /** ✅ 상품 수정 */
  async update(
    productId: string,
    data: {
      name?: string;
      content?: string;
      image?: string;
      price?: number;
      discountRate?: number;
      discountPrice?: number;
      discountStartTime?: string;
      discountEndTime?: string;
      categoryId?: string;
      stocks?: TransformedStock[];
    },
  ): Promise<Product> {
    const { stocks, ...safeData } = data;

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        ...safeData,
        stocks: stocks
          ? {
              deleteMany: { productId },
              create: stocks.map((s) => ({
                sizeId: s.sizeId,
                quantity: s.quantity ?? 0,
              })),
            }
          : undefined,
      },
    });
  }

  /** ✅ 연관 데이터까지 삭제 */
  async removeWithRelations(productId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.inquiry.deleteMany({ where: { productId } }),
      this.prisma.stock.deleteMany({ where: { productId } }),
      this.prisma.product.delete({ where: { id: productId } }),
    ]);
  }

  /** ✅ 단일 삭제 */
  async remove(productId: string): Promise<void> {
    await this.prisma.product.delete({ where: { id: productId } });
  }

  /** ✅ 상품 문의 등록 */
  async createInquiry(
    productId: string,
    dto: CreateInquiryDto & { userId: string },
  ): Promise<Inquiry> {
    return this.prisma.inquiry.create({
      data: {
        title: dto.title,
        content: dto.content,
        isSecret: dto.isSecret ?? false,
        userId: dto.userId,
        productId,
      },
    });
  }

  /** ✅ 상품 문의 조회 (reply 포함) */
  async findInquiries(productId: string) {
    return this.prisma.inquiry.findMany({
      where: { productId },
      include: {
        user: true,
        reply: {
          include: {
            user: true,
          },
        },
      },
    });
  }
}
