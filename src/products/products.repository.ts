import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Product, Inquiry, CategoryType } from '@prisma/client';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { TransformedStock } from './dto/create-product.dto';

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    store: { select: { name: true; image: true } };
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
    inquiries: {
      include: {
        user: true;
        reply: { include: { user: true } };
      };
    };
  };
}>;

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** ✅ 기본 이미지 경로 */
  private readonly DEFAULT_PRODUCT_IMAGE =
    'https://nb02-codiit-team2.s3.ap-northeast-2.amazonaws.com/default-product.png';
  private readonly DEFAULT_STORE_IMAGE =
    'https://nb02-codiit-team2.s3.ap-northeast-2.amazonaws.com/default-store.png';
  private readonly DEFAULT_PROFILE_IMAGE =
    'https://nb02-codiit-team2.s3.ap-northeast-2.amazonaws.com/default-profile.png';

  /** ✅ 스토어 ID로 조회 (PK) */
  async findStoreById(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) return null;
    return {
      ...store,
      image:
        store.image && store.image.trim() !== ''
          ? store.image
          : this.DEFAULT_STORE_IMAGE,
    };
  }

  /** ✅ 판매자 ID로 스토어 조회 (unique) */
  async findStoreBySellerId(sellerId: string) {
    const store = await this.prisma.store.findUnique({ where: { sellerId } });
    if (!store) return null;
    return {
      ...store,
      image:
        store.image && store.image.trim() !== ''
          ? store.image
          : this.DEFAULT_STORE_IMAGE,
    };
  }

  /** ⚙️ 카테고리명으로 카테고리 조회 */
  async findCategoryByName(name: string) {
    return this.prisma.category.findFirst({
      where: { name: name.toUpperCase() as CategoryType },
    });
  }

  /** ⚙️ 사이즈명으로 사이즈 조회 (기존 코드 유지) */
  async findStockSizeByName(name: string) {
    return this.prisma.stockSize.findFirst({ where: { name } });
  }

  /** ⚙️ 사이즈ID로 사이즈 조회 (ProductsService용) */
  async findStockSizeById(id: string) {
    // ✅ string
    return this.prisma.stockSize.findUnique({ where: { id } });
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
        image:
          data.image && data.image.trim() !== ''
            ? data.image
            : this.DEFAULT_PRODUCT_IMAGE,
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

  /** ✅ 상품 목록 조회 (기본 이미지 포함) */
  async findAll(query: FindProductsQueryDto): Promise<ProductWithRelations[]> {
    const where: Prisma.ProductWhereInput = {};

    if (query.categoryName) {
      where.category = {
        name: query.categoryName.toUpperCase() as CategoryType,
      };
    }

    if (query.search) {
      where.name = { contains: query.search };
    }

    const products = await this.prisma.product.findMany({
      where,
      skip: query.skip,
      take: query.take,
      include: {
        store: { select: { name: true, image: true } },
        reviews: { select: { rating: true } },
        stocks: { include: { size: true } },
      },
    });

    return products.map((product) => ({
      ...product,
      image:
        product.image && product.image.trim() !== ''
          ? product.image
          : this.DEFAULT_PRODUCT_IMAGE,
      store: {
        ...product.store,
        image:
          product.store?.image && product.store.image.trim() !== ''
            ? product.store.image
            : this.DEFAULT_STORE_IMAGE,
      },
    }));
  }

  /** ✅ 상품 상세 조회 (기본 이미지 + 문의 작성자 이미지 포함) */
  async findOne(productId: string): Promise<ProductDetailWithRelations | null> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        store: true,
        category: true,
        stocks: { include: { size: true } },
        reviews: true,
        inquiries: {
          include: {
            user: true,
            reply: { include: { user: true } },
          },
        },
      },
    });

    if (!product) return null;

    return {
      ...product,
      image:
        product.image && product.image.trim() !== ''
          ? product.image
          : this.DEFAULT_PRODUCT_IMAGE,
      store: {
        ...product.store,
        image:
          product.store?.image && product.store.image.trim() !== ''
            ? product.store.image
            : this.DEFAULT_STORE_IMAGE,
      },
      inquiries: product.inquiries.map((inq) => ({
        ...inq,
        user: {
          ...inq.user,
          image:
            inq.user?.image && inq.user.image.trim() !== ''
              ? inq.user.image
              : this.DEFAULT_PROFILE_IMAGE,
        },
        reply: inq.reply
          ? {
              ...inq.reply,
              user: {
                ...inq.reply.user,
                image:
                  inq.reply.user?.image && inq.reply.user.image.trim() !== ''
                    ? inq.reply.user.image
                    : this.DEFAULT_PROFILE_IMAGE,
              },
            }
          : null,
      })),
    };
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
        image:
          data.image && data.image.trim() !== ''
            ? data.image
            : this.DEFAULT_PRODUCT_IMAGE,
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

  /** ✅ 상품 문의 조회 */
  async findInquiries(productId: string) {
    const inquiries = await this.prisma.inquiry.findMany({
      where: { productId },
      include: {
        user: true,
        reply: { include: { user: true } },
      },
    });

    return inquiries.map((inq) => ({
      ...inq,
      user: {
        ...inq.user,
        image:
          inq.user?.image && inq.user.image.trim() !== ''
            ? inq.user.image
            : this.DEFAULT_PROFILE_IMAGE,
      },
      reply: inq.reply
        ? {
            ...inq.reply,
            user: {
              ...inq.reply.user,
              image:
                inq.reply.user?.image && inq.reply.user.image.trim() !== ''
                  ? inq.reply.user.image
                  : this.DEFAULT_PROFILE_IMAGE,
            },
          }
        : null,
    }));
  }
}
