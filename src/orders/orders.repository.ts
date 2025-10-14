import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Order, Payment, Prisma, User, Product, Store } from '@prisma/client';

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ✅ 유저 조회
   */
  async findUserById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  /**
   * ✅ 상품 목록 조회 (주문 생성 시 가격 확인용)
   */
  async findProductsWithRelations(productIds: string[]): Promise<
    (Product & {
      store: Store;
      stocks: Prisma.StockGetPayload<{ include: { size: true } }>[];
    })[]
  > {
    return this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { store: true, stocks: { include: { size: true } } },
    });
  }

  /**
   * ✅ 주문 생성
   */
  async createOrder(data: Prisma.OrderCreateInput): Promise<Order> {
    return this.prisma.order.create({ data });
  }

  /**
   * ✅ 주문 항목 생성
   */
  async createOrderItems(
    items: Prisma.OrderItemCreateManyInput[],
  ): Promise<void> {
    await this.prisma.orderItem.createMany({ data: items });
  }

  /**
   * ✅ 포인트 차감
   */
  async deductUserPoints(userId: string, usePoint: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { points: { decrement: usePoint } },
    });
  }

  /**
   * ✅ 포인트 로그 기록
   */
  async createPointTransaction(data: Prisma.PointTransactionCreateInput) {
    await this.prisma.pointTransaction.create({ data });
  }

  /**
   * ✅ 결제 생성
   */
  async createPayment(data: Prisma.PaymentCreateInput): Promise<Payment> {
    return this.prisma.payment.create({ data });
  }

  /**
   * ✅ 단일 주문 상세 조회 (orderItems, payment 포함)
   */
  async findOrderById(orderId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: { store: true, stocks: { include: { size: true } } },
            },
          },
        },
        payments: true,
      },
    });
  }
}
