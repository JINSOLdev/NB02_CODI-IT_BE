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
  UseGuards,
} from '@nestjs/common';
import { ProductsService, ProductWithStore } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { Product, Inquiry } from '@prisma/client';
import { InquiryWithRelations } from '../types/inquiry-with-relations.type';
import { JwtAuthGuard } from '../auth/jwt.guard';
import type { RequestWithUser } from '../auth/auth.types';
type ProductListResponse = {
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


@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /** 상품 등록 */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() dto: CreateProductDto,
    @Req() req: RequestWithUser,
  ): Promise<Product> {
    return this.productsService.create(dto, req.user.userId);
  }

  /** 상품 목록 조회 (비로그인 가능) */
  @Get()
  async findAll(
    @Query() query: FindProductsQueryDto,
  ): Promise<ProductListResponse> {
    return this.productsService.findAll(query);
  }

  /** 상품 상세 조회 (비로그인 가능) */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProductWithStore> {
    return this.productsService.findOne(id);
  }

  /** 상품 수정 */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Req() req: RequestWithUser,
  ): Promise<Product> {
    return this.productsService.update(id, dto, req.user.userId);
  }

  /** 상품 삭제 */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    return this.productsService.remove(id, req.user.userId);
  }

  /** 상품 문의 등록 */
  @Post(':id/inquiries')
  @UseGuards(JwtAuthGuard)
  async createInquiry(
    @Param('id') productId: string,
    @Body() dto: CreateInquiryDto,
    @Req() req: RequestWithUser,
  ): Promise<Inquiry> {
    return this.productsService.createInquiry(productId, dto, req.user.userId);
  }

  /** 상품 문의 조회 */
  @Get(':id/inquiries')
  @UseGuards(JwtAuthGuard)
  async findInquiries(
    @Param('id') productId: string,
    @Req() req: RequestWithUser,
  ): Promise<InquiryWithRelations[]> {
    return this.productsService.findInquiries(productId, req.user.userId);
  }
}
