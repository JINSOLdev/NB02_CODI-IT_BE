import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  async create(sellerId: string, role: string, dto: CreateStoreDto) {
    if (role !== UserRole.SELLER) {
      throw new ForbiddenException('SELLER만 스토어를 생성할 수 있습니다.');
    }

    const already = await this.prisma.store.findFirst({ where: { sellerId } });
    if (already) throw new ConflictException('이미 등록된 스토어가 있습니다.');

    return this.prisma.store.create({
      data: { ...dto, sellerId },
    });
  }
}
