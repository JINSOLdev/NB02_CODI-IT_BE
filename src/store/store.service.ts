import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Injectable,
} from '@nestjs/common';
import { StoreRepository } from './store.repository';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoreDetailDto } from './dto/store-detail.dto';
import { UserRole, Prisma } from '@prisma/client';

@Injectable()
export class StoreService {
  constructor(private readonly storeRepo: StoreRepository) {}

  async create(sellerId: string, role: UserRole, dto: CreateStoreDto) {
    if (role !== UserRole.SELLER) {
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

    return this.storeRepo.create(data);
  }
  async getStoreDetail(storeId: string): Promise<StoreDetailDto> {
    const store = await this.storeRepo.findById(storeId);
    if (!store) throw new NotFoundException('스토어를 찾을 수 없습니다.');

    const favoriteCount = await this.storeRepo.countFavorites(storeId);

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
}
