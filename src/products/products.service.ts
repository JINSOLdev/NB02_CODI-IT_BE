import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { Product, Inquiry } from '@prisma/client';
import { InquiryWithRelations } from '../types/inquiry-with-relations.type';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  /** 상품 등록 */
  async create(dto: CreateProductDto, storeId: string): Promise<Product> {
    const { price, discountRate, name, categoryId } = dto;

    // ✅ 스토어 존재 여부 확인
    const store = await this.productsRepository.findStoreById(storeId);
    if (!store) {
      throw new NotFoundException('스토어를 찾을 수 없습니다.');
    }

    // ✅ 카테고리 존재 여부 확인
    const category = await this.productsRepository.findCategoryById(categoryId);
    if (!category) {
      throw new NotFoundException('카테고리가 없습니다.');
    }

    // ✅ 중복 상품명 체크
    const existingProduct = await this.productsRepository.findByName(
      name,
      storeId,
    );
    if (existingProduct) {
      throw new BadRequestException('이미 상품이 존재합니다.');
    }

    // ✅ 할인 가격 계산
    let discountPrice: number | undefined;
    if (discountRate && discountRate > 0) {
      discountPrice = Math.floor(price * (1 - discountRate / 100));
    }

    try {
      return await this.productsRepository.create({
        ...dto,
        storeId,
        discountPrice,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
      throw new InternalServerErrorException(
        '상품 등록 중 알 수 없는 오류가 발생했습니다.',
      );
    }
  }

  /** 상품 목록 조회 */
  async findAll(query: FindProductsQueryDto): Promise<Product[]> {
    return this.productsRepository.findAll(query);
  }

  /** 상품 상세 조회 */
  async findOne(productId: string): Promise<Product> {
    const product = await this.productsRepository.findOne(productId);
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
    return product;
  }

  /** 상품 수정 */
  async update(
    productId: string,
    dto: UpdateProductDto & { storeId: string },
  ): Promise<Product> {
    const product = await this.productsRepository.findOne(productId);
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    // ✅ 권한 체크 (Swagger에는 없지만 현재 유지 중)
    if (product.storeId !== dto.storeId) {
      throw new ForbiddenException('이 상품을 수정할 권한이 없습니다.');
    }

    // ✅ 할인 가격 계산
    const { price, discountRate } = dto;
    let discountPrice: number | undefined;
    if (price && discountRate && discountRate > 0) {
      discountPrice = Math.floor(price * (1 - discountRate / 100));
    }

    try {
      return await this.productsRepository.update(productId, {
        ...dto,
        discountPrice,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
      throw new InternalServerErrorException(
        '상품 수정 중 알 수 없는 오류가 발생했습니다.',
      );
    }
  }

  /** 상품 삭제 */
  async remove(productId: string, storeId: string): Promise<void> {
    const product = await this.productsRepository.findOne(productId);
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    // ✅ 권한 체크
    if (product.storeId !== storeId) {
      throw new ForbiddenException('이 상품을 삭제할 권한이 없습니다.');
    }

    try {
      await this.productsRepository.remove(productId);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
      throw new InternalServerErrorException(
        '상품 삭제 중 알 수 없는 오류가 발생했습니다.',
      );
    }
  }

  /** 상품 문의 등록 */
  async createInquiry(
    productId: string,
    dto: CreateInquiryDto & { userId: string },
  ): Promise<Inquiry> {
    // ✅ 상품 존재 여부 확인 추가
    const product = await this.productsRepository.findOne(productId);
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    try {
      return await this.productsRepository.createInquiry(productId, dto);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
      throw new InternalServerErrorException(
        '상품 문의 등록 중 알 수 없는 오류가 발생했습니다.',
      );
    }
  }

  /** 상품 문의 조회 */
  async findInquiries(productId: string): Promise<InquiryWithRelations[]> {
    // ✅ 상품 존재 여부 확인 추가
    const product = await this.productsRepository.findOne(productId);
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    try {
      return await this.productsRepository.findInquiries(productId);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
      throw new InternalServerErrorException(
        '상품 문의 조회 중 알 수 없는 오류가 발생했습니다.',
      );
    }
  }
}
