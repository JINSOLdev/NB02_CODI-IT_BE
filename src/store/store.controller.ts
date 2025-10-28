import {
  Controller,
  UseGuards,
  Patch,
  Param,
  Body,
  Post,
  Req,
  Get,
  Query,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import type { AuthUser } from '../auth/auth.types';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoreDetailDto } from './dto/store-detail.dto';
import { MyStoreDetailDto } from './dto/mystore-detail.dto';
import { StoreResponseDto } from './dto/store-response.dto';
import { MyInterestStoreDto } from './dto/register-interest-store.dto';
import { MyStoreProductQueryDto } from './dto/store-product-query.dto';
import { MyStoreProductListWrapperDto } from './dto/store-product-wrapper.dto';
import { ParseCuidPipe } from '../common/pipes/parse-cuid.pipe';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateStoreResponseDto } from './dto/create-store-response.dto';
import { S3Service } from '../s3/s3.service';
import { imageFileFilter } from 'src/s3/s3.controller';
import { UpdateStoreFormDto } from './dto/update-store-form.dto';

@ApiTags('stores')
@Controller('api/stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: { user: AuthUser }, @Body() dto: CreateStoreDto) {
    const user = req.user;

    return this.storeService.createStore(user.userId, user.type, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('detail/my')
  getMyStoreDetail(@Req() req: { user: AuthUser }): Promise<MyStoreDetailDto> {
    const user = req.user;
    return this.storeService.getMyStoreDetail(user.userId, user.type);
  }

  @UseGuards(JwtAuthGuard)
  @Get('detail/my/product')
  getMyStoreProducts(
    @Req() req: { user: AuthUser },
    @Query() query: MyStoreProductQueryDto,
  ): Promise<MyStoreProductListWrapperDto> {
    const { userId, type } = req.user;
    return this.storeService.getMyStoreProducts(userId, type, query);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':storeId/favorite')
  registerInterestStore(
    @Param('storeId', ParseCuidPipe) storeId: string,
    @Req() req: { user: AuthUser },
  ): Promise<{ store: MyInterestStoreDto }> {
    const user = req.user;
    return this.storeService.registerInterestStore(storeId, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':storeId/favorite')
  deleteInterestStore(
    @Param('storeId', ParseCuidPipe) storeId: string,
    @Req() req: { user: AuthUser },
  ): Promise<{ store: MyInterestStoreDto }> {
    const user = req.user;
    return this.storeService.deleteInterestStore(storeId, user.userId);
  }

  @Get(':storeId')
  getStoreDetail(
    @Param('storeId', ParseCuidPipe) storeId: string,
  ): Promise<StoreDetailDto> {
    return this.storeService.getStoreDetail(storeId);
  }

  // src/store/store.controller.ts (updateStore만 교체해도 됨)

  @UseGuards(JwtAuthGuard)
  @Patch(':storeId')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('image', {
      fileFilter: imageFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async updateStore(
    @Param('storeId', ParseCuidPipe) storeId: string,
    @Req() req: { user: AuthUser },
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() form: UpdateStoreFormDto, // ← FE의 toStoreFormData로 만든 FormData가 들어옴
  ): Promise<CreateStoreResponseDto> {
    const { userId, type: userType } = req.user;

    // FE가 보내는 키(생성과 동일)
    // - storeName
    // - address.basic
    // - address.detail (optional)
    // - phoneNumber
    // - description
    // - image (optional File)

    // 빈 문자열은 “수정 안 함”으로 처리
    const toUpdatable = (value?: string) =>
      value === '' || value === undefined ? undefined : value;

    // address.basic / address.detail 만 처리 (브래킷 표기도 허용)
    const anyForm: any = form;
    const basic = anyForm['address.basic'] ?? anyForm['address[basic]'];
    const detail = anyForm['address.detail'] ?? anyForm['address[detail]'];

    // 서비스 입력 DTO로 변환 (undefined인 필드는 DB 업데이트에서 제외됨)
    const updateDto: UpdateStoreDto = {
      name: toUpdatable(anyForm.storeName),
      address: toUpdatable(basic),
      detailAddress: toUpdatable(detail),
      phoneNumber: toUpdatable(anyForm.phoneNumber),
      content: toUpdatable(anyForm.description),
      // image는 아래에서 결정
    };

    // 파일이 있으면 업로드 후 URL 교체, 없으면 이미지 유지
    if (file) {
      const { url } = await this.s3Service.uploadFile(file);
      updateDto.image = url; // string
    }
    // 파일이 없고 remove 플래그도 없으므로 이미지 필드는 건드리지 않음(= 유지)

    const updatedStore = await this.storeService.updateStore(
      storeId,
      userId,
      userType,
      updateDto,
    );

    // FE가 ‘생성’에서 쓰던 응답 형태 그대로 맞춰주기 (상태 반영 용이)
    return {
      id: updatedStore.id,
      storeName: updatedStore.name,
      phoneNumber: updatedStore.phoneNumber,
      description: updatedStore.content,
      address: {
        basic: updatedStore.address,
        ...(updatedStore.detailAddress
          ? { detail: updatedStore.detailAddress }
          : {}),
      },
      image: updatedStore.image ?? undefined,
      createdAt: updatedStore.createdAt,
      updatedAt: updatedStore.updatedAt,
    };
  }
}
