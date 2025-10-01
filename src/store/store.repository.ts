import { DateTime } from 'luxon';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Store, OrderStatus } from '@prisma/client';

export type ProductListRow = {
  id: string;
  name: string;
  image: string | null;
  price: number;
  discountPrice: number | null;
  discountRate: number | null;
  discountStartTime: Date | null;
  discountEndTime: Date | null;
  createdAt: Date;
};

@Injectable()
export class StoreRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySellerId(sellerId: string): Promise<Store | null> {
    return await this.prisma.store.findFirst({
      where: { sellerId },
    });
  }

  async findByStoreId(id: string): Promise<Store | null> {
    return await this.prisma.store.findUnique({ where: { id } });
  }

  async findStoreIdBySellerId(sellerId: string): Promise<string | null> {
    const store = await this.prisma.store.findFirst({
      where: { sellerId },
      select: { id: true },
    });
    return store?.id ?? null;
  }

  async countProductByStoreId(storeId: string): Promise<number> {
    return this.prisma.product.count({ where: { storeId } });
  }

  async findProductPageByStoreId(
    storeId: string,
    skip: number,
    take: number,
  ): Promise<ProductListRow[]> {
    return this.prisma.product.findMany({
      where: { storeId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        image: true,
        price: true,
        discountPrice: true,
        discountRate: true,
        discountStartTime: true,
        discountEndTime: true,
        createdAt: true,
      },
    });
  }
  async findStockRowsForProductsIds(
    productIds: string[],
  ): Promise<Array<{ productId: string; quantity: number }>> {
    if (productIds.length === 0) return [];
    return this.prisma.stock.findMany({
      where: { productId: { in: productIds } },
      select: { productId: true, quantity: true },
    });
  }

  async createStore(data: Prisma.StoreCreateInput): Promise<Store> {
    return await this.prisma.store.create({ data });
  }

  async updateStore(id: string, data: Prisma.StoreUpdateInput): Promise<Store> {
    return await this.prisma.store.update({
      where: { id },
      data,
    });
  }

  async getBySellerId(sellerId: string): Promise<boolean> {
    const storeCount = await this.prisma.store.count({
      where: { sellerId },
    });
    return storeCount > 0;
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
    
  async registerFavoriteStore(storeId: string, userId: string): Promise<void> {
    await this.prisma.favoriteStore.upsert({
      where: { userId_storeId: { userId, storeId } },
      create: { userId, storeId },
      update: {},
    });
  }
  
  async deleteFavoriteStore(storeId: string, userId: string): Promise<void> {
    await this.prisma.favoriteStore.delete({
      where: { userId_storeId: { userId, storeId } },
    });
  }  
}
