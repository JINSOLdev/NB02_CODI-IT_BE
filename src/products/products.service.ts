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
import {
  Product,
  Inquiry,
  AnswerStatus,
  Stock,
  Category,
} from '@prisma/client';
import type { InquiryWithRelations } from '../types/inquiry-with-relations.type';

export type ProductListResponse = {
  list: Array<{
    id: string;
    storeId: string;
    storeName: string;
    name: string;
    image: string | null;
    price: number;
    discountPrice: number | null;
    discountRate: number | null;
    discountStartTime: Date | null;
    discountEndTime: Date | null;
    reviewsCount: number;
    reviewsRating: number;
    createdAt: Date;
    updatedAt: Date;
    sales: number;
    isSoldOut: boolean;
  }>;
  totalCount: number;
};

export type ProductResponse = {
  id: string;
  storeId: string;
  storeName: string;
  name: string;
  image: string | null;
  price: number;
  discountPrice: number | null;
  discountRate: number | null;
  discountStartTime: Date | null;
  discountEndTime: Date | null;
  reviewsCount: number;
  reviewsRating: number;
  createdAt: Date;
  updatedAt: Date;
  sales: number;
  isSoldOut: boolean;
  reviews: {
    rate1Length: number;
    rate2Length: number;
    rate3Length: number;
    rate4Length: number;
    rate5Length: number;
    sumScore: number;
  };
  inquiries: Inquiry[];
  category: Category;
  stocks: Stock[];
};

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

export type InquiryResponse = {
  list: InquiryWithRelations[];
  totalCount: number;
};

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) { }

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

      const safeErr = err as Record<string, unknown>;
      const errorMessage =
        typeof safeErr.message === 'string'
          ? safeErr.message
          : '상품 등록 중 오류가 발생했습니다.';

      throw new InternalServerErrorException(errorMessage);
    }
  }

  /** 상품 목록 조회 */
  async findAll(query: FindProductsQueryDto): Promise<ProductListResponse> {
    const products = await this.productsRepository.findAll(query);
    // 상품 목록 가공
    const List = products.map((product) => {
      const reviewsRating =
        product.reviews.reduce((sum, review) => sum + review.rating, 0) /
        product.reviews.length;
      return {
        id: product.id,
        storeId: product.storeId,
        storeName: product.store?.name,
        name: product.name,
        image: product.image,
        price: product.price,
        discountPrice: product.discountPrice,
        discountRate: product.discountRate,
        discountStartTime: product.discountStartTime,
        discountEndTime: product.discountEndTime,
        reviewsCount: product.reviews.length,
        reviewsRating: reviewsRating,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        sales: product.sales,
        isSoldOut: !product.stocks?.some((stock) => stock.quantity > 0),
      };
    });
    return {
      list: List,
      totalCount: List.length,
    };
  }

  /** 상품 상세 조회 */
  async findOne(productId: string): Promise<ProductResponse> {
    const product = await this.productsRepository.findOne(productId);
    if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');
    const reviewsRating =
      product.reviews.reduce((sum, review) => sum + review.rating, 0) /
      product.reviews.length;
    const reviews = {
      rate1Length: product.reviews.filter((review) => review.rating === 1)
        .length,
      rate2Length: product.reviews.filter((review) => review.rating === 2)
        .length,
      rate3Length: product.reviews.filter((review) => review.rating === 3)
        .length,
      rate4Length: product.reviews.filter((review) => review.rating === 4)
        .length,
      rate5Length: product.reviews.filter((review) => review.rating === 5)
        .length,
      // 평균 별점
      sumScore: product.reviews.reduce(
        (sum, review) => sum + review.rating / product.reviews.length,
        0,
      ),
    };
    const response = {
      id: product.id,
      storeId: product.storeId,
      storeName: product.store?.name,
      name: product.name,
      image: product.image,
      price: product.price,
      discountPrice: product.discountPrice,
      discountRate: product.discountRate,
      discountStartTime: product.discountStartTime,
      discountEndTime: product.discountEndTime,
      reviewsCount: product.reviews.length,
      reviewsRating: reviewsRating,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      sales: product.sales,
      isSoldOut: !product.stocks?.some((stock) => stock.quantity > 0),
      reviews,
      inquiries: product.inquiries,
      category: product.category,
      stocks: product.stocks,
    };
    return response;
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

      const store = await this.productsRepository.findStoreBySellerId(sellerId);
      if (!store || store.id !== product.storeId) {
        throw new ForbiddenException('이 상품을 수정할 권한이 없습니다.');
      }

      let categoryId: string | undefined;
      if (dto.categoryName) {
        const category = await this.productsRepository.findCategoryByName(
          dto.categoryName,
        );
        if (!category) throw new NotFoundException('카테고리가 없습니다.');
        categoryId = category.id;
      }

      const { price, discountRate, stocks, ...restDto } = dto;

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

      const safeErr = err as Record<string, unknown>;
      const errorMessage =
        typeof safeErr.message === 'string'
          ? safeErr.message
          : '상품 수정 중 오류가 발생했습니다.';

      throw new InternalServerErrorException(errorMessage);
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

      const safeErr = err as Record<string, unknown>;
      const errorMessage =
        typeof safeErr.message === 'string'
          ? safeErr.message
          : '상품 삭제 중 오류가 발생했습니다.';

      throw new InternalServerErrorException(errorMessage);
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

      const safeErr = err as Record<string, unknown>;
      const errorMessage =
        typeof safeErr.message === 'string'
          ? safeErr.message
          : '상품 문의 등록 중 오류가 발생했습니다.';

      throw new InternalServerErrorException(errorMessage);
    }
  }

  /** 상품 문의 조회 (타입 안전 매핑 + 비밀글 권한 확인) */
  async findInquiries(
    productId: string,
    userId: string,
  ): Promise<InquiryResponse> {
    const product = (await this.productsRepository.findOne(
      productId,
    )) as ProductWithStore | null;

    if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');

    // ✅ 명시적 타입 지정 (ESLint no-unsafe-assignment 방지)
    const result = await this.productsRepository.findInquiries(productId);
    const { list, totalCount } = result;
    const inquiries: InquiryResponse = { list, totalCount };

    const transformedList: InquiryWithRelations[] = list.map((inq) => {
      // ✅ 비밀글 접근 권한 확인
      if (inq.isSecret) {
        const isOwner = inq.userId === userId;
        const isSeller = product.store.sellerId === userId;
        if (!isOwner && !isSeller) {
          return {
            id: inq.id,
            title: '비밀 문의',
            content: '비밀문의\n',
            status: inq.status ?? AnswerStatus.WaitingAnswer,
            isSecret: inq.isSecret ?? false,
            createdAt: inq.createdAt,
            updatedAt: inq.updatedAt,
            userId: inq.userId,
            productId: inq.productId,
            user: {
              id: inq.user.id,
              name: inq.user.name,
            },
            reply: null, // 답변도 비공개
          };
        }
      }

      // ✅ reply: 단일 객체 또는 null
      return {
        id: inq.id,
        title: inq.title ?? '',
        content: inq.content,
        status: inq.status ?? AnswerStatus.WaitingAnswer,
        isSecret: inq.isSecret ?? false,
        createdAt: inq.createdAt,
        updatedAt: inq.updatedAt,
        userId: inq.userId,
        productId: inq.productId,
        user: {
          id: inq.user.id,
          name: inq.user.name,
        },
        reply: inq.reply
          ? {
            id: inq.reply.id,
            content: inq.reply.content,
            createdAt: inq.reply.createdAt,
            updatedAt: inq.reply.updatedAt,
            user: {
              id: inq.reply.user.id,
              name: inq.reply.user.name,
            },
          }
          : null,
      };
    });

    return { list: transformedList, totalCount: inquiries.totalCount };
  }
}
