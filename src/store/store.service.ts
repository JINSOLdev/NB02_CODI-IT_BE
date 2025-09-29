import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserType, Prisma } from '@prisma/client';
import { StoreRepository, ProductListRow } from './store.repository';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoreDetailDto } from './dto/store-detail.dto';
import { MyStoreDetailDto } from './dto/mystore-detail.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoreResponseDto } from './dto/store-response.dto';
import { MyStoreProductQueryDto } from './dto/store-product-query.dto';
import { MyStoreProductListItemDto } from './dto/store-product-list.dto';
import { MyStoreProductListWrapperDto } from './dto/store-product-wrapper.dto';
import { DateTime } from 'luxon';

@Injectable()
export class StoreService {
  constructor(private readonly storeRepo: StoreRepository) {}

  async createStore(sellerId: string, userType: UserType, dto: CreateStoreDto) {
    if (userType !== UserType.SELLER) {
      throw new ForbiddenException('SELLER만 스토어를 생성할 수 있습니다.');
    }

    const existStore = await this.storeRepo.getBySellerId(sellerId);
    if (existStore)
      throw new ConflictException('이미 등록된 스토어가 있습니다.');

    const data: Prisma.StoreCreateInput = {
      name: dto.name,
      address: dto.address,
      detailAddress: dto.detailAddress,
      phoneNumber: dto.phoneNumber,
      content: dto.content,
      image: dto.image ?? null,
      seller: { connect: { id: sellerId } },
    };

    return this.storeRepo.createStore(data);
  }

  async updateStore(
    storeId: string,
    userId: string,
    userType: UserType,
    dto: UpdateStoreDto,
  ): Promise<StoreResponseDto> {
    if (userType !== UserType.SELLER)
      throw new ForbiddenException('판매자만 스토어를 수정할 수 있습니다. ');

    const store = await this.storeRepo.findByStoreId(storeId);
    if (!store) throw new NotFoundException('스토어를 찾을 수 없습니다.');

    if (store.sellerId !== userId)
      throw new UnauthorizedException('해당 스토어의 판매자가 아닙니다.');

    const data: Prisma.StoreUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.detailAddress !== undefined && {
        detailAddress: dto.detailAddress,
      }),
      ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber }),
      ...(dto.content !== undefined && { content: dto.content }),
      ...(dto.image !== undefined && { image: dto.image }),
    };

    const updatedStore = await this.storeRepo.updateStore(storeId, data);

    return {
      id: updatedStore.id,
      name: updatedStore.name,
      createdAt: updatedStore.createdAt,
      updatedAt: updatedStore.updatedAt,
      userId: updatedStore.sellerId,
      address: updatedStore.address,
      detailAddress: updatedStore.detailAddress,
      phoneNumber: updatedStore.phoneNumber,
      content: updatedStore.content,
      image: updatedStore.image ?? null,
    };
  }

  async getStoreDetail(storeId: string): Promise<StoreDetailDto> {
    const store = await this.storeRepo.findByStoreId(storeId);
    if (!store) throw new NotFoundException('스토어를 찾을 수 없습니다.');

    const favoriteCount = await this.storeRepo.favoriteCounts(storeId);

    const result: StoreDetailDto = {
      id: store.id,
      name: store.name,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
      userId: store.sellerId,
      address: store.address,
      detailAddress: store.detailAddress,
      phoneNumber: store.phoneNumber,
      content: store.content,
      image: store.image ?? undefined,
      favoriteCount,
    };
    return result;
  }

  async getMyStoreDetail(
    sellerId: string,
    usertype: UserType,
  ): Promise<MyStoreDetailDto> {
    if (usertype !== UserType.SELLER)
      throw new ForbiddenException('판매자만 조회할 수 있습니다.');

    const store = await this.storeRepo.findBySellerId(sellerId);
    if (!store) throw new NotFoundException('등록된 스토어가 없습니다.');

    const [productCount, favoriteCount, monthFavoriteCount, totalSoldCount] =
      await Promise.all([
        this.storeRepo.productCounts(store.id),
        this.storeRepo.favoriteCounts(store.id),
        this.storeRepo.monthFavoriteCounts(store.id),
        this.storeRepo.totalSoldCounts(store.id),
      ]);

    return {
      id: store.id,
      name: store.name,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
      userId: store.sellerId,
      address: store.address,
      detailAddress: store.detailAddress,
      phoneNumber: store.phoneNumber,
      content: store.content,
      image: store.image ?? undefined,
      productCount,
      favoriteCount,
      monthFavoriteCount,
      totalSoldCount,
    };
  }

  // 판매자 본인의 스토어 상품을 page/pageSize로 조회하여 스웨거에 작성된 응답 형태로 반환
  async getMyStoreProducts(
    userId: string,
    userType: UserType,
    { page, pageSize }: MyStoreProductQueryDto,
  ): Promise<MyStoreProductListWrapperDto> {
    // 권한 확인
    if (userType !== UserType.SELLER)
      throw new ForbiddenException('판매자만 조회할 수 있습니다.');

    // 내 스토어 찾기
    const storeId = await this.storeRepo.findStoreIdBySellerId(userId);
    if (!storeId) throw new NotFoundException('등록된 스토어가 없습니다.');

    // offset 계산
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // 전체 상품 개수
    const totalCount = await this.storeRepo.countProductByStoreId(storeId);

    // 현재 페이지 상품 목록
    const products = await this.storeRepo.findProductPageByStoreId(
      storeId,
      skip,
      take,
    );

    if (products.length === 0) return { list: [], totalCount };

    // 현재 페이지에 보여지는 productIds
    const productIds = products.map((product) => product.id);

    // 재고 row 조회(사이즈별)
    const stockRows =
      await this.storeRepo.findStockRowsForProductsIds(productIds);

    // 각 productId 재고 합계
    const stockByProductId: Record<string, number> = {};
    for (const row of stockRows) {
      const prev = stockByProductId[row.productId] ?? 0;
      stockByProductId[row.productId] = prev + row.quantity;
    }

    // 할인 기간 계산하기 위한 기준 시각
    const nowDate = DateTime.now();

    const list: MyStoreProductListItemDto[] = products.map((product) =>
      this.mapRowToListItem(product, stockByProductId, nowDate),
    );

    const response: MyStoreProductListWrapperDto = { list, totalCount };
    return response;
  }

  private mapRowToListItem(
    product: ProductListRow,
    stockByProductId: Record<string, number>,
    nowDate: DateTime,
  ): MyStoreProductListItemDto {
    const stockSum = stockByProductId[product.id] ?? 0;

    const hasDiscountValue =
      product.discountPrice != null || product.discountRate != null;

    const start = product.discountStartTime
      ? DateTime.fromJSDate(product.discountStartTime)
      : null;

    const end = product.discountEndTime
      ? DateTime.fromJSDate(product.discountEndTime)
      : null;

    const isInDiscountPeriod =
      (!start || nowDate >= start) && (!end || nowDate <= end);

    const isDiscount = hasDiscountValue && isInDiscountPeriod;

    const createdAtUTC = DateTime.fromJSDate(product.createdAt)
      .toUTC()
      .toISO({ suppressMilliseconds: false });

    return {
      id: product.id,
      image: product.image ?? undefined,
      name: product.name,
      price: product.price,
      stock: stockSum,
      isDiscount,
      createdAt: createdAtUTC ?? product.createdAt.toISOString(),
      isSoldOut: stockSum <= 0,
    };
  }
}
