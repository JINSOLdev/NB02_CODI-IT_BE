import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { Product, Inquiry } from '@prisma/client';
import { InquiryWithRelations } from '../types/inquiry-with-relations.type';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** ✅ 스토어 조회 */
  async findStoreById(storeId: string) {
    return await this.prisma.store.findUnique({
      where: { id: storeId },
    });
  }

  /** ✅ 카테고리 조회 */
  async findCategoryById(categoryId: string) {
    return await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
  }

  /** ✅ 같은 스토어 내 상품명 중복 체크 */
  async findByName(name: string, storeId: string): Promise<Product | null> {
    return await this.prisma.product.findFirst({
      where: { name, storeId },
    });
  }

  /** 상품 생성 */
  async create(
    data: CreateProductDto & { storeId: string; discountPrice?: number },
  ): Promise<Product> {
    return await this.prisma.product.create({
      data: {
        name: data.name,
        content: data.content,
        image: data.image,
        price: data.price,
        discountRate: data.discountRate,
        discountPrice: data.discountPrice,
        discountStartTime: data.discountStartTime,
        discountEndTime: data.discountEndTime,
        // ✅ 관계 매핑
        store: { connect: { id: data.storeId } },
        category: { connect: { id: data.categoryId } },
      },
    });
  }

  /** 상품 목록 조회 */
  async findAll(query: FindProductsQueryDto): Promise<Product[]> {
    const { skip, take, categoryId } = query;

    return await this.prisma.product.findMany({
      where: categoryId ? { categoryId } : {},
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** 상품 상세 조회 */
  async findOne(productId: string): Promise<Product | null> {
    return await this.prisma.product.findUnique({
      where: { id: productId },
    });
  }

  /** 상품 수정 */
  async update(
    productId: string,
    data: UpdateProductDto & { discountPrice?: number },
  ): Promise<Product> {
    return await this.prisma.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        content: data.content,
        image: data.image,
        price: data.price,
        discountRate: data.discountRate,
        discountPrice: data.discountPrice,
        discountStartTime: data.discountStartTime,
        discountEndTime: data.discountEndTime,
        ...(data.categoryId && {
          category: {
            connect: { id: data.categoryId },
          },
        }),
      },
    });
  }

  /** 상품 삭제 */
  async remove(productId: string): Promise<void> {
    await this.prisma.product.delete({
      where: { id: productId },
    });
  }

  /** 상품 문의 생성 */
  async createInquiry(
    productId: string,
    dto: CreateInquiryDto & { userId: string },
  ): Promise<Inquiry> {
    return await this.prisma.inquiry.create({
      data: {
        title: dto.title,
        content: dto.content,
        isSecret: dto.isSecret,
        // ✅ 관계 매핑
        user: { connect: { id: dto.userId } },
        product: { connect: { id: productId } },
      },
    });
  }

  /** 상품 문의 조회 */
  async findInquiries(productId: string): Promise<InquiryWithRelations[]> {
    const inquiries = await this.prisma.inquiry.findMany({
      where: { productId },
      include: {
        user: true,
        product: true,
        reply: true, // ✅ InquiryWithRelations 타입에 맞추기 위해 reply 포함
      },
      orderBy: { createdAt: 'desc' },
    });

    return inquiries as unknown as InquiryWithRelations[];
  }
}
