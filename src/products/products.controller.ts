import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ProductsService, ProductWithStore } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { Product, Inquiry } from '@prisma/client';
import { InquiryWithRelations } from '../types/inquiry-with-relations.type';

interface MockUserHeader {
  id: string; // 로그인 유저 ID (sellerId 또는 buyerId)
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /** 상품 등록 */
  @Post()
  async create(
    @Body() dto: CreateProductDto,
    @Req() req: Request,
  ): Promise<Product> {
    const mockUser = req.headers['x-mock-user']
      ? (JSON.parse(req.headers['x-mock-user'] as string) as MockUserHeader)
      : null;
    const sellerId = mockUser?.id; // ✅ sellerId

    return this.productsService.create(dto, sellerId!);
  }

  /** 상품 목록 조회 */
  @Get()
  async findAll(@Query() query: FindProductsQueryDto): Promise<Product[]> {
    return this.productsService.findAll(query);
  }

  /** 상품 상세 조회 */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProductWithStore> {
    return this.productsService.findOne(id);
  }

  /** 상품 수정 */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Req() req: Request,
  ): Promise<Product> {
    const mockUser = req.headers['x-mock-user']
      ? (JSON.parse(req.headers['x-mock-user'] as string) as MockUserHeader)
      : null;
    const sellerId = mockUser?.id;

    return this.productsService.update(id, dto, sellerId!);
  }

  /** 상품 삭제 */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: Request): Promise<void> {
    const mockUser = req.headers['x-mock-user']
      ? (JSON.parse(req.headers['x-mock-user'] as string) as MockUserHeader)
      : null;
    const sellerId = mockUser?.id;

    return this.productsService.remove(id, sellerId!);
  }

  /** 상품 문의 등록 */
  @Post(':id/inquiries')
  async createInquiry(
    @Param('id') productId: string,
    @Body() dto: CreateInquiryDto,
    @Req() req: Request,
  ): Promise<Inquiry> {
    const mockUser = req.headers['x-mock-user']
      ? (JSON.parse(req.headers['x-mock-user'] as string) as MockUserHeader)
      : null;
    const userId = mockUser?.id;

    return this.productsService.createInquiry(productId, dto, userId!);
  }

  /** 상품 문의 조회 */
  @Get(':id/inquiries')
  async findInquiries(
    @Param('id') productId: string,
    @Req() req: Request,
  ): Promise<InquiryWithRelations[]> {
    const mockUser = req.headers['x-mock-user']
      ? (JSON.parse(req.headers['x-mock-user'] as string) as MockUserHeader)
      : null;
    const userId = mockUser?.id;

    return this.productsService.findInquiries(productId, userId!);
  }
}
