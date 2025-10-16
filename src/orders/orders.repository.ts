import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ✅ 트랜잭션 래퍼
   */
  async $transaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ) {
    return this.prisma.$transaction(callback);
  }

  /**
   * ✅ 유저 존재 확인
   */
  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  /**
   * ✅ 주문 생성 후 상세 조회 (상품 + 스토어 + 사이즈 포함)
   */
  async findOrderById(orderId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                store: true,
                stocks: {
                  include: {
                    size: true,
                  },
                },
              },
            },
          },
        },
        payments: true,
      },
    });
  }

  /**
   * ✅ 주문 수정
   */
  async updateOrder(orderId: string, data: Prisma.OrderUpdateInput) {
    return this.prisma.order.update({
      where: { id: orderId },
      data,
    });
  }

  /**
   * ✅ 상품 정보 조회 (주문 시 유효성 검증용)
   */
  async findProductsWithRelations(productIds: string[]) {
    return this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        store: true,
        stocks: {
          include: {
            size: true,
          },
        },
      },
    });
  }
}
