import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Store, OrderStatus } from '@prisma/client';
import { DateTime } from 'luxon';

@Injectable()
export class StoreRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySellerId(sellerId: string): Promise<Store | null> {
    return await this.prisma.store.findFirst({
      where: { sellerId },
    });
  }

  async createStore(data: Prisma.StoreCreateInput): Promise<Store> {
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

  async favoriteCounts(storeId: string): Promise<number> {
    return this.prisma.favoriteStore.count({ where: { storeId } });
  }

  async productCounts(storeId: string): Promise<number> {
    return this.prisma.product.count({ where: { storeId } });
  }

  async monthFavoriteCounts(storeId: string): Promise<number> {
    const nowDateTime = DateTime.now();

    const monthOfStart = nowDateTime.startOf('month');
    return this.prisma.favoriteStore.count({
      where: {
        storeId,
        createdAt: {
          gte: monthOfStart.toJSDate(),
        },
      },
    });
  }

  async totalSoldCounts(storeId: string): Promise<number> {
    const result = await this.prisma.orderItem.aggregate({
      where: {
        product: { storeId },
        order: { status: OrderStatus.COMPLETEDPAYMENT },
      },
      _sum: { quantity: true },
    });

    return result._sum?.quantity ?? 0;
  }
}
