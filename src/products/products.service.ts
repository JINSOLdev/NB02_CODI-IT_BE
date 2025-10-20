import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import {
  CreateProductDto,
  CreateStockDto,
  TransformedStock,
} from './dto/create-product.dto';
import { UpdateProductDto, UpdateStockDto } from './dto/update-product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { Product, Inquiry } from '@prisma/client';
import type { InquiryWithRelations } from '../types/inquiry-with-relations.type';

export interface ProductWithStore extends Product {
  store: {
    id: string;
    name: string;
    sellerId: string;
    content: string;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
    address: string;
    detailAddress: string;
    phoneNumber: string;
  };
}

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  /** 🔧 stocks 변환: sizeName → sizeId */
  private async transformStocks(
    stocks: (CreateStockDto | UpdateStockDto)[],
  ): Promise<TransformedStock[]> {
    return Promise.all(
      stocks.map(async (stock) => {
        if (!stock.sizeName) {
          throw new NotFoundException('사이즈명이 필요합니다.');
        }
        const size = await this.productsRepository.findStockSizeByName(
          stock.sizeName,
        );
        if (!size) {
          throw new NotFoundException(
            `사이즈 ${stock.sizeName}를 찾을 수 없습니다.`,
          );
        }
        return { sizeId: size.id, quantity: stock.quantity ?? 0 };
      }),
    );
  }

  /** 상품 등록 */
  async create(dto: CreateProductDto, sellerId: string): Promise<Product> {
    try {
      const { price, discountRate, categoryName } = dto;

      // ✅ sellerId로 store 찾기
      const store = await this.productsRepository.findStoreBySellerId(sellerId);
      if (!store) throw new NotFoundException('스토어를 찾을 수 없습니다.');

      const category =
        await this.productsRepository.findCategoryByName(categoryName);
      if (!category) throw new NotFoundException('카테고리가 없습니다.');

      let discountPrice: number | undefined;
      if (discountRate !== undefined && discountRate >= 0) {
        discountPrice = Math.floor(price * (1 - discountRate / 100));
      }

      const stocks = dto.stocks ? await this.transformStocks(dto.stocks) : [];

      return await this.productsRepository.create({
        ...dto,
        storeId: store.id,
        discountPrice,
        categoryId: category.id,
        stocks,
      });
    } catch (err: unknown) {
      if (
        err instanceof NotFoundException ||
        err instanceof ForbiddenException
      ) {
        throw err;
      }
      throw new InternalServerErrorException(
        err instanceof Error
          ? err.message
          : '상품 등록 중 오류가 발생했습니다.',
      );
    }
  }

  /** 상품 목록 조회 */
  async findAll(query: FindProductsQueryDto): Promise<Product[]> {
    return this.productsRepository.findAll(query);
  }

  /** 상품 상세 조회 */
  async findOne(productId: string): Promise<ProductWithStore> {
    const product = (await this.productsRepository.findOne(
      productId,
    )) as ProductWithStore | null;
    if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');
    return product;
  }

  /** 상품 수정 */
  async update(
    productId: string,
    dto: UpdateProductDto,
    sellerId: string,
  ): Promise<Product> {
    try {
      const product = await this.productsRepository.findOne(productId);
      if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');

      // ✅ 권한 체크
      const store = await this.productsRepository.findStoreBySellerId(sellerId);
      if (!store || store.id !== product.storeId) {
        throw new ForbiddenException('이 상품을 수정할 권한이 없습니다.');
      }

      // ✅ categoryName → categoryId 변환
      let categoryId: string | undefined;
      if (dto.categoryName) {
        const category = await this.productsRepository.findCategoryByName(
          dto.categoryName,
        );
        if (!category) throw new NotFoundException('카테고리가 없습니다.');
        categoryId = category.id;
      }

      const { price, discountRate, stocks, ...restDto } = dto;

      // ✅ discountPrice 계산
      let discountPrice: number | undefined;
      if (discountRate !== undefined && discountRate >= 0) {
        discountPrice = Math.floor(
          (price ?? product.price) * (1 - discountRate / 100),
        );
      }

      return await this.productsRepository.update(productId, {
        ...restDto,
        price,
        discountRate,
        discountPrice,
        ...(categoryId && { categoryId }),
        ...(stocks && { stocks: await this.transformStocks(stocks) }),
      });
    } catch (err: unknown) {
      console.error('❌ Product update error:', err);
      if (
        err instanceof NotFoundException ||
        err instanceof ForbiddenException
      ) {
        throw err;
      }
      throw new InternalServerErrorException(
        err instanceof Error
          ? err.message
          : '상품 수정 중 오류가 발생했습니다.',
      );
    }
  }

  /** 상품 삭제 */
  async remove(productId: string, sellerId: string): Promise<void> {
    try {
      const product = await this.productsRepository.findOne(productId);
      if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');

      const store = await this.productsRepository.findStoreBySellerId(sellerId);
      if (!store || store.id !== product.storeId) {
        throw new ForbiddenException('이 상품을 삭제할 권한이 없습니다.');
      }

      await this.productsRepository.removeWithRelations(productId);
    } catch (err: unknown) {
      if (
        err instanceof NotFoundException ||
        err instanceof ForbiddenException
      ) {
        throw err;
      }
      throw new InternalServerErrorException(
        err instanceof Error
          ? err.message
          : '상품 삭제 중 오류가 발생했습니다.',
      );
    }
  }

  /** 상품 문의 등록 */
  async createInquiry(
    productId: string,
    dto: CreateInquiryDto,
    userId: string,
  ): Promise<Inquiry> {
    try {
      const product = await this.productsRepository.findOne(productId);
      if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');
      return this.productsRepository.createInquiry(productId, {
        ...dto,
        userId,
      });
    } catch (err: unknown) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException(
        err instanceof Error
          ? err.message
          : '상품 문의 등록 중 오류가 발생했습니다.',
      );
    }
  }

  /** 상품 문의 조회 (타입 안전 매핑 + 비밀글 권한 확인) */
  async findInquiries(
    productId: string,
    userId: string,
  ): Promise<InquiryWithRelations[]> {
    const product = (await this.productsRepository.findOne(
      productId,
    )) as ProductWithStore | null;

    if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');

    const inquiriesRaw = await this.productsRepository.findInquiries(productId);

    // 원시 레코드를 안전하게 다루기 위한 베이스 타입
    type ReplyRaw = {
      id: string;
      content: string;
      createdAt: Date;
      updatedAt: Date;
      user: { id: string; name: string };
    };
    type InquiryRaw = {
      id: string;
      content: string;
      createdAt: Date;
      updatedAt: Date;
      userId: string;
      isSecret?: boolean;
      user: { id: string; name: string };
      reply?: ReplyRaw[] | ReplyRaw | null;
    };

    const result: InquiryWithRelations[] = (inquiriesRaw as InquiryRaw[]).map(
      (inq) => {
        // 비밀글 접근 권한 확인 (반환 구성 전에 확인)
        if (inq.isSecret) {
          const isOwner = inq.userId === userId;
          const isSeller = product.store.sellerId === userId;
          if (!isOwner && !isSeller) {
            throw new ForbiddenException('비밀글을 조회할 권한이 없습니다.');
          }
        }

        // reply: 널-세이프 + 배열 정규화
        const replyRaw = inq.reply;
        const replyArr: ReplyRaw[] = Array.isArray(replyRaw)
          ? replyRaw
          : replyRaw
            ? [replyRaw]
            : [];

        // 스펙에 맞춰 DTO 매핑 (첫 번째 답변 또는 null로 변환)
        const replyDto: InquiryWithRelations['reply'] = replyArr.length
          ? {
              id: replyArr[0].id,
              content: replyArr[0].content,
              createdAt: replyArr[0].createdAt,
              updatedAt: replyArr[0].updatedAt,
              user: {
                id: replyArr[0].user.id,
                name: replyArr[0].user.name,
              },
            }
          : null;

        const transformed: InquiryWithRelations = {
          id: inq.id,
          content: inq.content,
          createdAt: inq.createdAt,
          updatedAt: inq.updatedAt,
          user: {
            id: inq.user.id,
            name: inq.user.name,
          },
          reply: replyDto,
          title: '',
          status: 'WaitingAnswer',
          isSecret: false,
          userId: '',
          productId: '',
        };

        return transformed;
      },
    );

    return result;
  }
}
