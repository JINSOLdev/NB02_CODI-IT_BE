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
import { NotFoundException } from '@nestjs/common';
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
      throw new NotFoundException('판매자 정보를 찾을 수 없습니다');
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

    // 판매 데이터 조회
    const salesDataPromises = periods.map(async (period) => {
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
      return {
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
    });

    const salesData = await Promise.all(salesDataPromises);

    // 2. 많이 팔린 상품 조회
    const products = await this.prisma.product.findMany({
      where: {
        storeId: store.id, // 특정 스토어 ID로 필터링
      },
      select: {
        id: true,
        name: true,
        price: true,
        sales: true,
      },
      orderBy: {
        sales: 'desc', // 판매량(sales) 기준 내림차순
      },
    });

    const topSales = products.map((product) => ({
      totalOrders: product.sales,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
      },
    }));

    // 3. 가격대별 매출 조회

    // 가격대별 매출 가져오기
    const priceRangeData = await this.prisma.$queryRaw<{ price_range: string; total_sales: number }[]>`
    SELECT
      CASE
        WHEN oi.price < 20000 THEN '~20,000 원'
        WHEN oi.price < 50000 THEN '~50,000 원'
        WHEN oi.price < 100000 THEN '~100,000 원'
        WHEN oi.price < 200000 THEN '~200,000 원'
        ELSE '200,000원 이상'
      END as price_range,
      SUM(oi.price) as total_sales
    FROM "OrderItem" oi
    JOIN "Order" o ON o.id = oi."orderId"
    WHERE o."storeId" = ${store.id}
      AND o.status = 'COMPLETEDPAYMENT'
    GROUP BY price_range
    ORDER BY MIN(oi.price);
  `;

    // 총 매출 계산
    const totalSales = priceRangeData.reduce(
      (acc, cur) => acc + Number(cur.total_sales),
      0,
    );

    // 가격대별 매출 + 매출비중 계산
    const result = priceRangeData.map((row) => ({
      priceRange: row.price_range,
      totalSales: Number(row.total_sales),
      percentage:
        totalSales > 0
          ? Number(((Number(row.total_sales) / totalSales) * 100).toFixed(1))
          : 0,
    }));

    return {
      today: salesData[0],
      week: salesData[1],
      month: salesData[2],
      year: salesData[3],
      topSales,
      priceRange: result,
    };
  }
}
