import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import {
  OrderStatus,
  PaymentStatus,
  User,
  Order,
  Payment,
  Prisma,
} from '@prisma/client';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 🛒 주문 생성 (프론트 기준)
   */
  async createOrder(
    userId: string,
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    const { name, phone, address, orderItems, usePoint = 0 } = dto;

    // ✅ 유저 검증
    const user: User | null = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('존재하지 않는 사용자입니다.');

    // ✅ 포인트 초과 사용 방지
    if (usePoint > user.points)
      throw new BadRequestException('보유 포인트를 초과했습니다.');

    // ✅ 상품 유효성 검증
    type ProductWithRelations = Prisma.ProductGetPayload<{
      include: { store: true; stocks: { include: { size: true } } };
    }>;

    const products: ProductWithRelations[] = await this.prisma.product.findMany(
      {
        where: { id: { in: orderItems.map((i) => i.productId) } },
        include: { store: true, stocks: { include: { size: true } } },
      },
    );

    if (products.length !== orderItems.length) {
      throw new BadRequestException('유효하지 않은 상품이 포함되어 있습니다.');
    }

    // ✅ 첫 번째 상품의 스토어 ID를 사용
    const storeId = products[0].storeId;

    try {
      // ✅ 트랜잭션 처리
      const result: { createdOrder: Order; payment: Payment } =
        await this.prisma.$transaction(async (tx) => {
          // (1) 주문 기본 생성
          const createdOrder: Order = await tx.order.create({
            data: {
              userId,
              storeId,
              recipientName: name,
              recipientPhone: phone,
              address,
              subtotal: 0, // 서버 계산
              totalQuantity: 0,
              usePoint,
              totalPrice: 0,
              status: OrderStatus.PROCESSING,
            },
          });

          // (2) 주문 항목 생성
          await tx.orderItem.createMany({
            data: orderItems.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              if (!product)
                throw new BadRequestException('상품 정보를 찾을 수 없습니다.');
              return {
                orderId: createdOrder.id,
                productId: item.productId,
                quantity: item.quantity,
                price: product.price,
              };
            }),
          });

          // (3) 포인트 차감
          if (usePoint > 0) {
            await tx.user.update({
              where: { id: userId },
              data: { points: { decrement: usePoint } },
            });

            await tx.pointTransaction.create({
              data: {
                userId,
                delta: -usePoint,
                reason: '상품 주문 시 포인트 사용',
                orderId: createdOrder.id,
              },
            });
          }

          // (4) 결제 금액 계산
          const totalPrice = orderItems.reduce((acc, item) => {
            const product = products.find((p) => p.id === item.productId);
            return acc + (product ? product.price * item.quantity : 0);
          }, 0);

          // (5) 결제 생성
          const payment: Payment = await tx.payment.create({
            data: {
              orderId: createdOrder.id,
              price: totalPrice,
              status: PaymentStatus.COMPLETED,
            },
          });

          return { createdOrder, payment };
        });

      const { createdOrder, payment } = result;

      // ✅ 응답 구조 (프론트 기준)
      const response: any = {
        id: createdOrder.id,
        name,
        phoneNumber: phone,
        address,
        subtotal: payment.price,
        totalQuantity: orderItems.reduce((acc, i) => acc + i.quantity, 0),
        usePoint,
        createdAt: createdOrder.createdAt,
        orderItems: orderItems.map((item, i) => {
          const product = products.find((p) => p.id === item.productId);
          if (!product)
            throw new BadRequestException('상품 정보가 누락되었습니다.');

          return {
            id: `item-${i}`,
            price: product.price,
            quantity: item.quantity,
            productId: product.id,
            isReviewed: false,
            product: {
              name: product.name,
              image: product.image ?? 'https://example.com/image.png',
              reviews: [],
            },
            size: {
              size: {
                en: 'M',
                ko: 'M',
              },
            },
          };
        }),
        payments: {
          id: payment.id,
          price: payment.price,
          status: 'CompletedPayment',
          createdAt: payment.createdAt,
          orderId: createdOrder.id,
        },
      };

      return plainToInstance(OrderResponseDto, response);
    } catch (error) {
      console.error('❌ 주문 생성 중 오류:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        '주문 생성 중 오류가 발생했습니다.',
      );
    }
  }
}
