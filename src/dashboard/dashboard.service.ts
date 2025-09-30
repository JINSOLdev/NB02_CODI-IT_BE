import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  subDays,
  subWeeks,
  subMonths,
  subYears,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
} from 'date-fns';
export interface SalesPeriod {
  current: { totalOrders: number; totalSales: number };
  previous: { totalOrders: number; totalSales: number };
  changeRate: { totalOrders: number; totalSales: number };
}

interface TopSale {
  totalOrders: number;
  product: { id: string; name: string; price: number };
}

export interface PriceRange {
  priceRange: string;
  totalSales: number;
  percentage: number;
}

export interface SalesReport {
  today: SalesPeriod;
  week: SalesPeriod;
  month: SalesPeriod;
  year: SalesPeriod;
  topSales: TopSale[];
  priceRange: PriceRange[];
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(userId: string) {
    // 스토어 정보 가져오기
    const store = await this.prisma.store.findUnique({
      where: { sellerId: userId },
    });
    if (!store) {
      throw new Error('판매자 정보를 찾을 수 없습니다');
    }
    // 1. 일/주/월/년 판매 데이터 조회
    // 기간 구분
    const periods = [
      {
        key: 'today',
        start: startOfDay(new Date()),
        previous: startOfDay(subDays(new Date(), 1)),
      },
      {
        key: 'week',
        start: startOfWeek(new Date(), { weekStartsOn: 1 }),
        previous: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
      },
      {
        key: 'month',
        start: startOfMonth(new Date()),
        previous: startOfMonth(subMonths(new Date(), 1)),
      },
      {
        key: 'year',
        start: startOfYear(new Date()),
        previous: startOfYear(subYears(new Date(), 1)),
      },
    ];

    // 기간별 구분
    const salesData: Partial<SalesPeriod> = {};
    for (const period of periods) {
      //현재 기간
      const current = await this.prisma.order.aggregate({
        where: {
          storeId: store.id,
          createdAt: { gte: period.start },
          status: 'COMPLETEDPAYMENT',
        },
        _count: { id: true },
        _sum: { totalPrice: true },
      });

      //이전 기간
      const previous = await this.prisma.order.aggregate({
        where: {
          storeId: store.id,
          createdAt: { gte: period.previous, lt: period.start },
          status: 'COMPLETEDPAYMENT',
        },
        _count: { id: true },
        _sum: { totalPrice: true },
      });

      // 변화율 계산 (%, 소수점 첫째 자리)
      const totalOrdersCurrent = current._count.id || 0;
      const totalSalesCurrent = current._sum.totalPrice || 0;
      const totalOrdersPrevious = previous._count.id || 0;
      const totalSalesPrevious = previous._sum.totalPrice || 0;

      const orderChangeRate = totalOrdersPrevious
        ? Number(
            ((totalOrdersCurrent - totalOrdersPrevious) / totalOrdersPrevious) *
              100,
          ).toFixed(1)
        : 0;
      const salesChangeRate = totalSalesPrevious
        ? Number(
            ((totalSalesCurrent - totalSalesPrevious) / totalSalesPrevious) *
              100,
          ).toFixed(1)
        : 0;

      // 판매 데이터 저장
      salesData[period.key] = {
        current: {
          totalOrders: totalOrdersCurrent,
          totalSales: totalSalesCurrent,
        },
        previous: {
          totalOrders: totalOrdersPrevious,
          totalSales: totalSalesPrevious,
        },
        changeRate: {
          totalOrders: orderChangeRate,
          totalSales: salesChangeRate,
        },
      };
    }

    // 2. 많이 팔린 상품 조회
    // 주문순 상품 구분
    const topSales = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });
    // 상품 정보
    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: topSales.map((item) => item.productId),
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
    });

    const topSalesData = topSales.map((item) => ({
      totalOrders: item._count.id,
      product: products.find((product) => product.id === item.productId),
    }));

    // 3. 가격대별 매출 조회
    // 가격대 구분
    const priceRanges = [
      { label: '~20,000 원', min: 0, max: 20000 },
      { label: '~50,000 원', min: 20000, max: 50000 },
      { label: '~100,000 원', min: 50000, max: 100000 },
      { label: '~200,000 원', min: 100000, max: 200000 },
      { label: '200,000원 이상', min: 200000, max: 99999999 },
    ];

    // 스토어 총 매출
    const totalSales = await this.prisma.orderItem.aggregate({
      where: {
        order: {
          storeId: store.id,
          status: 'COMPLETEDPAYMENT',
        },
      },
      _sum: { price: true },
    });

    // 가격대별 매출
    const priceRangeData: PriceRange[] = [];
    for (const range of priceRanges) {
      const sales = await this.prisma.orderItem.aggregate({
        where: {
          order: {
            storeId: store.id,
            status: 'COMPLETEDPAYMENT',
          },
          price: {
            gte: range.min,
            lte: range.max,
          },
        },
        _sum: { price: true },
      });
      priceRangeData.push({
        priceRange: range.label,
        totalSales: sales._sum.price || 0,
        percentage: totalSales._sum.price
          ? (() => {
              const ratio = (sales._sum.price || 0) / totalSales._sum.price;
              const percentage = ratio * 100;
              return Number(percentage.toFixed(1));
            })()
          : 0,
      });
    }

    return {
      salesData,
      topSalesData,
      priceRangeData,
    };
  }
}
