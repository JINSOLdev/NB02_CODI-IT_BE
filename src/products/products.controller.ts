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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiConsumes, ApiBody, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, CreateStockDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { Product, Inquiry } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt.guard';
import type { RequestWithUser } from '../auth/auth.types';
import type { productResponse, ProductListResponse } from './products.service';
import { S3Service } from '../s3/s3.service';
import { imageFileFilter } from '../s3/s3.controller';

@ApiTags('Products')
@Controller('api/products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly s3Service: S3Service,
  ) {}

  /** ✅ 상품 등록 (이미지 포함) */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '상품 등록 (FormData)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '상품 등록 요청',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: '운동화' },
        price: { type: 'number', example: 10000 },
        categoryName: { type: 'string', example: 'top' },
        content: { type: 'string', example: '<p>상품 설명입니다.</p>' },
        image: {
          type: 'string',
          format: 'binary',
          description: '상품 이미지 파일',
        },
        stocks: {
          type: 'string',
          example:
            '[{"sizeId":"clvxyz123","quantity":10},{"sizeId":"clvxyz456","quantity":5}]',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      fileFilter: imageFileFilter,
      limits: { fileSize: 1024 * 1024 * 10 }, // 10MB 제한
    }),
  )
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Record<string, unknown>,
    @Req() req: RequestWithUser,
  ): Promise<Product> {
    const sellerId = req.user.userId;

    // ✅ DTO 변환
    const dto = {
      ...body,
      price: Number(body.price), // ✅ 문자열 → 숫자 변환
      discountRate:
        body.discountRate !== undefined ? Number(body.discountRate) : undefined,
    } as unknown as CreateProductDto;

    // ✅ 이미지 처리 (S3 업로드 or 기본 이미지)
    if (file) {
      const result = await this.s3Service.uploadFile(file);
      dto.image = result.url;
    } else {
      dto.image =
        'https://nb02-codiit-team2.s3.ap-northeast-2.amazonaws.com/default-product.png';
    }

    // ✅ stocks 문자열 처리 (FormData → JSON 변환)
    if (typeof dto.stocks === 'string') {
      try {
        const parsed = JSON.parse(dto.stocks) as Array<{
          sizeId: string | number;
          quantity: number;
        }>;

        if (!Array.isArray(parsed)) {
          throw new BadRequestException('Stocks must be an array');
        }

        // ✅ string | number → string 변환 (Prisma cuid 호환)
        dto.stocks = parsed.map((item) => ({
          sizeId: String(item.sizeId), // ✅ 핵심 수정: Number → String
          quantity: Number(item.quantity),
        })) as CreateStockDto[];
      } catch {
        throw new BadRequestException('Invalid stocks format');
      }
    }

    return this.productsService.create(dto, sellerId);
  }

  /** ✅ 상품 목록 조회 */
  @Get()
  async findAll(
    @Query() query: FindProductsQueryDto,
  ): Promise<ProductListResponse> {
    return this.productsService.findAll(query);
  }

  /** ✅ 상품 상세 조회 */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<productResponse> {
    return this.productsService.findOne(id);
  }

  /** ✅ 상품 수정 */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Req() req: RequestWithUser,
  ): Promise<Product> {
    return this.productsService.update(id, dto, req.user.userId);
  }

  /** ✅ 상품 삭제 */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    return this.productsService.remove(id, req.user.userId);
  }

  /** ✅ 상품 문의 등록 */
  @Post(':id/inquiries')
  @UseGuards(JwtAuthGuard)
  async createInquiry(
    @Param('id') productId: string,
    @Body() dto: CreateInquiryDto,
    @Req() req: RequestWithUser,
  ): Promise<Inquiry> {
    return this.productsService.createInquiry(productId, dto, req.user.userId);
  }

  /** ✅ 상품 문의 조회 */
  @Get(':id/inquiries')
  @UseGuards(JwtAuthGuard)
  async findInquiries(
    @Param('id') productId: string,
    @Req() req: RequestWithUser,
  ): Promise<CreateInquiryDto[]> {
    return this.productsService.findInquiries(productId, req.user.userId);
  }
}
