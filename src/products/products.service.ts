import { Injectable, NotFoundException } from '@nestjs/common';
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
  async create(dto: CreateProductDto): Promise<Product> {
    // TODO: 현재 로그인한 사용자가 SELLER인지 확인 후 storeId 연결
    return this.productsRepository.create(dto);
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
  async update(productId: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productsRepository.findOne(productId);
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    // TODO: 현재 로그인한 사용자가 상품 소유자인지 확인
    return this.productsRepository.update(productId, dto);
  }

  /** 상품 삭제 */
  async remove(productId: string): Promise<void> {
    const product = await this.productsRepository.findOne(productId);
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    // TODO: 권한 체크 (storeId === currentUser.storeId)
    await this.productsRepository.remove(productId);
  }

  /** 상품 문의 등록 */
  async createInquiry(
    productId: string,
    dto: CreateInquiryDto,
  ): Promise<Inquiry> {
    // TODO: 현재 로그인한 userId 주입 필요
    return this.productsRepository.createInquiry(productId, dto);
  }

  /** 상품 문의 조회 */
  async findInquiries(productId: string): Promise<InquiryWithRelations[]> {
    return this.productsRepository.findInquiries(productId);
  }
}
