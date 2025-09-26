import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserType, Prisma } from '@prisma/client';
import { StoreRepository } from './store.repository';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoreDetailDto } from './dto/store-detail.dto';
import { MyStoreDetailDto } from './dto/mystore-detail.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoreResponseDto } from './dto/store-response.dto';

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
}
