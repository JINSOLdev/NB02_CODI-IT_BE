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
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { Product, Inquiry } from '@prisma/client';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * 상품 등록
   * POST /api/products
   */
  @Post()
  async create(@Body() dto: CreateProductDto): Promise<Product> {
    return this.productsService.create(dto);
  }

  /**
   * 상품 목록 조회
   * GET /api/products
   */
  @Get()
  async findAll(@Query() query: FindProductsQueryDto): Promise<Product[]> {
    return this.productsService.findAll(query);
  }

  /**
   * 상품 상세 조회
   * GET /api/products/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Product> {
    return this.productsService.findOne(id);
  }

  /**
   * 상품 수정
   * PATCH /api/products/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.update(id, dto);
  }

  /**
   * 상품 삭제
   * DELETE /api/products/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.productsService.remove(id);
  }

  /**
   * 상품 문의 등록
   * POST /api/products/:id/inquiries
   */
  @Post(':id/inquiries')
  async createInquiry(
    @Param('id') productId: string,
    @Body() dto: CreateInquiryDto,
  ): Promise<Inquiry> {
    return this.productsService.createInquiry(productId, dto);
  }

  /**
   * 상품 문의 조회
   * GET /api/products/:id/inquiries
   */
  @Get(':id/inquiries')
  async findInquiries(@Param('id') productId: string): Promise<Inquiry[]> {
    return this.productsService.findInquiries(productId);
  }
}
