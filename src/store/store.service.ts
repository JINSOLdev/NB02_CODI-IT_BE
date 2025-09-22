import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { StoreRepository } from './store.repository';
import { CreateStoreDto } from './dto/create-store.dto';
import { UserType, Prisma } from '@prisma/client';

@Injectable()
export class StoreService {
  constructor(private readonly storeRepo: StoreRepository) {}

  async create(sellerId: string, role: UserType, dto: CreateStoreDto) {
    if (role !== UserType.SELLER) {
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
}
