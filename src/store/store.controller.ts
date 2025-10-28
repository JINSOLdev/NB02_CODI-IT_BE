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
import { memoryStorage } from 'multer';
import { imageFileFilter } from 'src/s3/s3.controller';

@ApiTags('stores')
@Controller('api/stores')
export class StoreController {
  constructor(
    private readonly storeService: StoreService,
    private readonly s3Service: S3Service,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('image', {
      fileFilter: imageFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async create(
    @Req() req: { user: AuthUser },
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png|gif)$/i,
        })
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 })
        .build({ fileIsRequired: false }),
    )
    file: Express.Multer.File | undefined,
    @Body() dto: CreateStoreDto,
  ): Promise<CreateStoreResponseDto> {
    const user = req.user;

    if (file) {
      const { url } = await this.s3Service.uploadFile(file);
      dto.image = url;
    }

    const createdStore = await this.storeService.createStore(
      user.userId,
      user.type,
      dto,
    );

    console.log('store/create body:', dto);
    console.log('store/create file:', !!file, file?.mimetype, file?.size);

    return {
      id: createdStore.id,
      storeName: createdStore.name,
      phoneNumber: createdStore.phoneNumber,
      description: createdStore.content,
      address: {
        basic: createdStore.address,
        ...(createdStore.detailAddress
          ? { detail: createdStore.detailAddress }
          : {}),
      },
      image: createdStore.image ?? undefined,
      createdAt: createdStore.createdAt,
      updatedAt: createdStore.updatedAt,
    };
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

  @UseGuards(JwtAuthGuard)
  @Patch(':storeId')
  updateStore(
    @Param('storeId', ParseCuidPipe) storeId: string,
    @Req() req: Request & { user: { userId: string; type: any } },
    @Body() dto: UpdateStoreDto,
  ): Promise<StoreResponseDto> {
    const user = req.user;
    return this.storeService.updateStore(storeId, user.userId, user.type, dto);
  }
}
