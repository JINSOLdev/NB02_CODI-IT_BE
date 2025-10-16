import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ✅ 유저 조회
  async findUserById(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  // ✅ 상품 + 관계 조회
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

  // ✅ 주문 ID로 상세 조회 (relations 포함)
  async findOrderById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                store: true,
                stocks: {
                  include: { size: true },
                },
              },
            },
          },
        },
        payments: true,
      },
    });
  }

  // ✅ 주문 수정 (수정 가능 필드만 업데이트)
  async updateOrder(orderId: string, dto: Prisma.OrderUpdateInput) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: dto,
      include: {
        items: {
          include: {
            product: {
              include: {
                store: true,
                stocks: { include: { size: true } },
              },
            },
          },
        },
        payments: true,
      },
    });
  }

  // ✅ 트랜잭션 실행
  async $transaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
