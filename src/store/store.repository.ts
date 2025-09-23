import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Store } from '@prisma/client';

@Injectable()
export class StoreRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySellerId(sellerId: string): Promise<Store | null> {
    return await this.prisma.store.findFirst({
      where: { sellerId },
    });
  }

  async create(data: Prisma.StoreCreateInput): Promise<Store> {
    return await this.prisma.store.create({ data });
  }

  async getBySellerId(sellerId: string): Promise<boolean> {
    const storeCount = await this.prisma.store.count({
      where: { sellerId },
    });
    return storeCount > 0;
  }

  async findById(id: string): Promise<Store | null> {
    return await this.prisma.store.findUnique({ where: { id } });
  }

  async countFavorites(storeId: string): Promise<number> {
    return this.prisma.favoriteStore.count({ where: { storeId } });
  }
}
