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
   * 주문 생성 (구매자 전용)
   */
  async createOrder(
    userId: string,
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    const {
      recipientName,
      recipientPhone,
      address,
      items,
      usePoint = 0,
      storeId,
      subtotal,
      totalQuantity,
      totalPrice,
    } = dto;

    // ✅ 1. 유저 검증
    const user: User | null = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('존재하지 않는 사용자입니다.');

    // ✅ 2. 포인트 사용 가능 여부 확인
    if (usePoint > user.points)
      throw new BadRequestException('보유 포인트를 초과했습니다.');

    // ✅ 3. 상품 유효성 확인 (타입 명시)
    type ProductWithRelations = Prisma.ProductGetPayload<{
      include: { store: true; stocks: { include: { size: true } } };
    }>;

    const products: ProductWithRelations[] = await this.prisma.product.findMany(
      {
        where: { id: { in: items.map((i) => i.productId) } },
        include: { store: true, stocks: { include: { size: true } } },
      },
    );

    if (products.length !== items.length) {
      throw new BadRequestException('유효하지 않은 상품이 포함되어 있습니다.');
    }

    try {
      // ✅ 4. 트랜잭션 처리
      const result: { createdOrder: Order; payment: Payment } =
        await this.prisma.$transaction(async (tx) => {
          // (1) 주문 생성
          const createdOrder: Order = await tx.order.create({
            data: {
              userId,
              storeId,
              recipientName,
              recipientPhone,
              address,
              subtotal,
              totalQuantity,
              usePoint,
              totalPrice,
              status: OrderStatus.PROCESSING,
            },
          });

          // (2) 주문 상품 생성
          await tx.orderItem.createMany({
            data: items.map((item) => {
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

          // (3) 포인트 차감 및 로그 생성
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

          // (4) 결제 생성
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

      // ✅ 5. 응답 매핑 (Swagger 구조에 맞춤)
      const response: OrderResponseDto = {
        id: createdOrder.id,
        name: recipientName,
        phoneNumber: recipientPhone,
        address,
        subtotal,
        totalQuantity,
        usePoint,
        createdAt: createdOrder.createdAt,
        orderItems: items.map((item, i) => {
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
              id: product.id,
              storeId: product.storeId,
              name: product.name,
              price: product.price,
              image: product.image ?? 'https://example.com/image.png',
              discountRate: product.discountRate ?? 0,
              discountStartTime: product.discountStartTime ?? new Date(),
              discountEndTime: product.discountEndTime ?? new Date(),
              createdAt: product.createdAt,
              updatedAt: product.updatedAt,
              store: {
                id: product.store.id,
                userId: product.store.sellerId,
                name: product.store.name,
                address: product.store.address,
                phoneNumber: product.store.phoneNumber,
                content: product.store.content,
                image: product.store.image ?? 'https://example.com/store.png',
                createdAt: product.store.createdAt,
                updatedAt: product.store.updatedAt,
              },
              stocks: product.stocks.map((s) => ({
                id: s.id,
                productId: s.productId,
                sizeId: s.sizeId,
                quantity: s.quantity,
                size: {
                  id: s.size.id,
                  name: s.size.name,
                },
              })),
            },
            size: {
              id: item.sizeId,
              name: 'M', // 프론트 전달 데이터 기준으로 실제 사이즈명 매핑 가능
            },
          };
        }),
        payment: {
          id: payment.id,
          price: payment.price,
          status: PaymentStatus.COMPLETED,
          createdAt: payment.createdAt,
          updatedAt: payment.createdAt,
          orderId: createdOrder.id,
        },
      } as OrderResponseDto;

      // ✅ plainToInstance 호출 시 excludeExtraneousValues 제거
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
