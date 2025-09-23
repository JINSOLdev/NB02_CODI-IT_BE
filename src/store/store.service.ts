import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Injectable,
} from '@nestjs/common';
import { StoreRepository } from './store.repository';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoreDetailDto } from './dto/store-detail.dto';
import { UserType, Prisma } from '@prisma/client';
import { MyStoreDetailDto } from './dto/mystore-detail.dto';

@Injectable()
export class StoreService {
  constructor(private readonly storeRepo: StoreRepository) {}

  async create(sellerId: string, type: UserType, dto: CreateStoreDto) {
    if (type !== UserType.SELLER) {
      throw new ForbiddenException('SELLER만 스토어를 생성할 수 있습니다.');
    }

    const exst_strs = await this.storeRepo.getBySellerId(sellerId);
    if (exst_strs)
      throw new ConflictException('이미 등록된 스토어가 있습니다.');

    const data: Prisma.StoreCreateInput = {
      name: dto.name,
      address: dto.address,
      detailAddress: dto.detailAddress,
      phoneNumber: dto.phoneNumber,
      content: dto.content,
      image: dto.image ?? null,
      // 모델에 sellerId가 FK 필드로 있으므로 아래처럼 사용
      seller: { connect: { id: sellerId } },
    };

    return this.storeRepo.createStore(data);
  }

  async getStoreDetail(storeId: string): Promise<StoreDetailDto> {
    const store = await this.storeRepo.findById(storeId);
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
    role: UserType,
  ): Promise<MyStoreDetailDto> {
    // 유효성 검증 필요한데...어떤거 필요? ......역할이 UserType.SELLER랑 맞는지 확인해야 할까? 스토어가 존재하는지는 확인해야 할 것 같고
    if (role !== UserType.SELLER)
      throw new ForbiddenException('판매자만 조회할 수 있습니다.');

    const store = await this.storeRepo.findBySellerId(sellerId);
    if (!store) throw new NotFoundException('등록된 스토어가 없습니다.');

    // 이것들은 어떻게 구하지...
    //productCount!: number;
    // favoriteCount!: number;
    // monthFavoriteCount!: number;
    // totalSoldCount!: number;
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
