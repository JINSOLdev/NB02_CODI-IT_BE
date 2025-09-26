import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import {
  Product,
  Inquiry,
  Prisma,
  CategoryType,
  StockSize,
} from '@prisma/client';
import { InquiryWithRelations } from '../types/inquiry-with-relations.type';

/** 상품 목록 조회용 타입 */
export interface ProductWithCategory {
  id: string;
  name: string;
  content: string | null;
  image: string | null;
  price: number;
  discountRate: number | null;
  discountPrice: number | null;
  discountStartTime: Date | null;
  discountEndTime: Date | null;
  sales: number;
  createdAt: Date;
  updatedAt: Date;
  storeId: string;
  categoryId: string;

  stocks: {
    id: string;
    productId: string;
    sizeId: string;
    quantity: number;
    size: StockSize; // ✅ include: { size: true } 로 함께 가져옴
  }[];
  category: {
    id: string;
    name: CategoryType;
  };
}

/** 상품 상세 조회용 타입 */
export interface ProductWithRelations extends ProductWithCategory {
  store: {
    id: string;
    name: string;
    content: string;
    image: string | null;
    address: string;
    detailAddress: string;
    phoneNumber: string;
    sellerId: string;
    createdAt: Date;
    updatedAt: Date;
  };
  reviews: {
    id: string;
    content: string;
    rating: number;
    userId: string;
    productId: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
  inquiries: InquiryWithRelations[];
}

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** 상품 등록 */
  async create(dto: CreateProductDto): Promise<Product> {
    return this.prisma.product.create({
      data: {
        storeId: dto.storeId,
        name: dto.name,
        content: dto.content,
        image: dto.image,
        price: dto.price,
        discountRate: dto.discountRate,
        discountPrice: dto.discountRate,
        discountStartTime: dto.discountStartTime
          ? new Date(dto.discountStartTime)
          : null,
        discountEndTime: dto.discountEndTime
          ? new Date(dto.discountEndTime)
          : null,
        categoryId: dto.categoryId,
        stocks: {
          create: dto.stocks.map((stock) => ({
            sizeId: stock.sizeId,
            quantity: stock.quantity,
          })),
        },
      },
      include: {
        stocks: { include: { size: true } }, // ✅ StockSize join
        category: true,
      },
    });
  }

  /** 상품 목록 조회 */
  async findAll(query: FindProductsQueryDto): Promise<ProductWithCategory[]> {
    return this.prisma.product.findMany({
      where: {
        name: query.search ? { contains: query.search } : undefined,
        price: {
          gte: query.priceMin ?? undefined,
          lte: query.priceMax ?? undefined,
        },
        category: query.categoryName
          ? { name: query.categoryName as CategoryType }
          : undefined,
      },
      include: {
        stocks: { include: { size: true } }, // ✅ 통일
        category: true,
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: this.mapSortOption(query.sort),
    });
  }

  /** 상품 상세 조회 */
  async findOne(productId: string): Promise<ProductWithRelations | null> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        stocks: { include: { size: true } }, // ✅ 통일
        category: true,
        store: true,
        reviews: true,
        inquiries: {
          include: {
            reply: {
              include: {
                user: { select: { id: true, nickname: true } },
              },
            },
            user: { select: { id: true, nickname: true } },
          },
        },
      },
    });

    return product as ProductWithRelations | null;
  }

  /** 상품 수정 */
  async update(productId: string, dto: UpdateProductDto): Promise<Product> {
    return this.prisma.product.update({
      where: { id: productId },
      data: {
        name: dto.name,
        content: dto.content,
        image: dto.image,
        price: dto.price,
        discountRate: dto.discountRate,
        discountPrice: dto.discountPrice,
        discountStartTime: dto.discountStartTime
          ? new Date(dto.discountStartTime)
          : null,
        discountEndTime: dto.discountEndTime
          ? new Date(dto.discountEndTime)
          : null,
        categoryId: dto.categoryId ?? undefined,
        stocks: dto.stocks
          ? {
              deleteMany: { productId },
              create: dto.stocks.map((stock) => ({
                sizeId: stock.sizeId!,
                quantity: stock.quantity!,
              })),
            }
          : undefined,
      },
      include: {
        stocks: { include: { size: true } },
        category: true,
      },
    });
  }

  /** 상품 삭제 */
  async remove(productId: string): Promise<void> {
    await this.prisma.product.delete({ where: { id: productId } });
  }

  /** 상품 문의 등록 */
  async createInquiry(
    productId: string,
    dto: CreateInquiryDto,
  ): Promise<Inquiry> {
    return this.prisma.inquiry.create({
      data: {
        productId,
        title: dto.title,
        content: dto.content,
        isSecret: dto.isSecret,
        userId: 'TEMP_USER_ID', // TODO: 로그인 유저 연결
      },
    });
  }

  /** 상품 문의 조회 */
  async findInquiries(productId: string): Promise<InquiryWithRelations[]> {
    const inquiries = await this.prisma.inquiry.findMany({
      where: { productId },
      include: {
        user: { select: { id: true, nickname: true } },
        reply: {
          include: {
            user: { select: { id: true, nickname: true } },
          },
        },
      },
    });

    return inquiries as unknown as InquiryWithRelations[];
  }

  /** 정렬 옵션 매핑 */
  private mapSortOption(sort?: string): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case 'lowPrice':
        return { price: Prisma.SortOrder.asc };
      case 'highPrice':
        return { price: Prisma.SortOrder.desc };
      case 'recent':
        return { createdAt: Prisma.SortOrder.desc };
      case 'salesRanking':
        return { sales: Prisma.SortOrder.desc };
      default:
        return { createdAt: Prisma.SortOrder.desc };
    }
  }
}
