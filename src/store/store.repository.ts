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

  // 판매자 ID로 스토어 조회
  async findBySellerId(sellerId: string): Promise<Store | null> {
    return await this.prisma.store.findFirst({
      where: { sellerId },
    });
  }

  // 스토어 ID로 스토어 조회
  async findByStoreId(id: string): Promise<Store | null> {
    return await this.prisma.store.findUnique({ where: { id } });
  }

  // 판매자 ID로 스토어 ID만 조회 > 존재하지 않으면 null
  async findStoreIdBySellerId(sellerId: string): Promise<string | null> {
    const store = await this.prisma.store.findFirst({
      where: { sellerId },
      select: { id: true },
    });
    return store?.id ?? null;
  }

  // 스토어 ID로 상품 총 갯수 카운트
  async countProductByStoreId(storeId: string): Promise<number> {
    return this.prisma.product.count({ where: { storeId } });
  }

  // 스토어 ID로 상품 페이지 조회 > 페이지네이션
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

  // 여러 상품 ID에 대한 재고 수량 조회
  async findStockRowsForProductsIds(
    productIds: string[],
  ): Promise<Array<{ productId: string; quantity: number }>> {
    if (productIds.length === 0) return [];
    return this.prisma.stock.findMany({
      where: { productId: { in: productIds } },
      select: { productId: true, quantity: true },
    });
  }

  // 새 스토어 등록
  async createStore(data: Prisma.StoreCreateInput): Promise<Store> {
    return await this.prisma.store.create({ data });
  }

  // 스토어 수정
  async updateStore(id: string, data: Prisma.StoreUpdateInput): Promise<Store> {
    return await this.prisma.store.update({
      where: { id },
      data,
    });
  }

  // 판매자에게 스토어 존재 여부만 확인
  async getBySellerId(sellerId: string): Promise<boolean> {
    const storeCount = await this.prisma.store.count({
      where: { sellerId },
    });
    return storeCount > 0;
  }

  // 관심 스토어 총 개수
  async favoriteCounts(storeId: string): Promise<number> {
    return this.prisma.favoriteStore.count({ where: { storeId } });
  }

  // 상품 총 갯수 조회
  async productCounts(storeId: string): Promise<number> {
    return this.prisma.product.count({ where: { storeId } });
  }

  // 이달의 관심 횟수
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

  // 총 판매 수량 > 완료된 주문만
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

  // 관심 스토어 등록 > 없으면 생성
  async registerFavoriteStore(storeId: string, userId: string): Promise<void> {
    await this.prisma.favoriteStore.upsert({
      where: { userId_storeId: { userId, storeId } },
      create: { userId, storeId },
      update: {},
    });
  }

  // 관심 스토어 해제
  async deleteFavoriteStore(storeId: string, userId: string): Promise<void> {
    await this.prisma.favoriteStore.delete({
      where: { userId_storeId: { userId, storeId } },
    });
  }
}
