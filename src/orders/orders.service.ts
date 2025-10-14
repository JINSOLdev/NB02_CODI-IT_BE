import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { plainToInstance } from 'class-transformer';
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  Payment,
  Order,
  User,
  Product,
  Store,
  OrderItem,
} from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly ordersRepository: OrdersRepository) {}

  /**
   * 🛒 주문 생성 (프론트 기준)
   */
  async createOrder(
    userId: string,
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    const { recipientName, recipientPhone, address, items, usePoint = 0 } = dto;

    try {
      // ✅ 유저 검증
      const user: User | null =
        await this.ordersRepository.findUserById(userId);
      if (!user) throw new NotFoundException('존재하지 않는 사용자입니다.');

      // ✅ 포인트 초과 사용 방지
      if (usePoint > user.points)
        throw new BadRequestException('보유 포인트를 초과했습니다.');

      // ✅ 상품 유효성 검증
      type ProductWithRelations = Prisma.ProductGetPayload<{
        include: { store: true; stocks: { include: { size: true } } };
      }>;

      const products: ProductWithRelations[] =
        await this.ordersRepository.findProductsWithRelations(
          items.map((i) => i.productId),
        );

      if (products.length !== items.length) {
        throw new BadRequestException(
          '유효하지 않은 상품이 포함되어 있습니다.',
        );
      }

      // ✅ 단일 스토어 검증
      const storeIds = products.map((p) => p.storeId);
      const uniqueStores = new Set(storeIds);
      if (uniqueStores.size > 1) {
        throw new BadRequestException(
          '서로 다른 스토어의 상품은 한 주문으로 결제할 수 없습니다.',
        );
      }
      const storeId = storeIds[0];

      // ✅ 금액 및 수량 재계산
      const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
      const totalPrice = items.reduce((acc, item) => {
        const product = products.find((p) => p.id === item.productId);
        return acc + (product ? product.price * item.quantity : 0);
      }, 0);

      // ✅ 트랜잭션 처리
      const result: { createdOrder: Order; payment: Payment } =
        await this.ordersRepository.$transaction(async (tx) => {
          // 주문 생성
          const createdOrder: Order = await tx.order.create({
            data: {
              userId,
              storeId,
              recipientName,
              recipientPhone,
              address,
              subtotal: totalPrice, // ✅ 서버 계산 금액 저장
              totalQuantity,
              usePoint,
              totalPrice,
              status: OrderStatus.PROCESSING,
            },
          });

          // 주문 아이템 생성
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
                sizeId: item.sizeId,
              };
            }),
          });

          // 포인트 차감
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

          // 결제 생성
          const payment: Payment = await tx.payment.create({
            data: {
              orderId: createdOrder.id,
              price: totalPrice,
              status: PaymentStatus.COMPLETED,
            },
          });

          // ✅ 결제 완료 → 주문 상태 변경
          await tx.order.update({
            where: { id: createdOrder.id },
            data: { status: OrderStatus.COMPLETEDPAYMENT },
          });

          return { createdOrder, payment };
        });

      // ✅ 트랜잭션 이후 재조회 (relations 포함)
      const createdOrder = await this.ordersRepository.findOrderById(
        result.createdOrder.id,
      );

      if (!createdOrder)
        throw new InternalServerErrorException(
          '주문 정보를 조회할 수 없습니다.',
        );

      // ✅ 타입 강화
      type FullOrderType = Order & {
        items: (OrderItem & {
          product: Product & {
            store: Store;
            stocks: { size: { id: number; en: string; ko: string } }[];
          };
        })[];
        payments?: Payment | null;
      };

      const fullOrder = createdOrder as unknown as FullOrderType;

      // ✅ 응답 변환
      return plainToInstance(OrderResponseDto, {
        id: fullOrder.id,
        name: fullOrder.recipientName,
        phoneNumber: fullOrder.recipientPhone,
        address: fullOrder.address,
        subtotal: fullOrder.subtotal,
        totalQuantity: fullOrder.totalQuantity,
        usePoint,
        createdAt: fullOrder.createdAt,
        orderItems: fullOrder.items.map((item) => ({
          id: item.id,
          price: item.price,
          quantity: item.quantity,
          productId: item.productId,
          isReviewed: false,
          product: {
            id: item.product.id,
            name: item.product.name,
            image: item.product.image ?? undefined,
            store: {
              id: item.product.store.id,
              name: item.product.store.name,
              address: item.product.store.address,
              image: item.product.store.image ?? null,
            },
          },
          size: {
            id: item.product.stocks?.[0]?.size?.id ?? 0,
            size: item.product.stocks?.[0]?.size ?? { en: 'M', ko: 'M' },
          },
        })),
        payments: {
          id: fullOrder.payments?.id ?? '',
          price: fullOrder.payments?.price ?? 0,
          status: 'CompletedPayment',
          createdAt: fullOrder.payments?.createdAt ?? new Date(),
          orderId: fullOrder.id,
        },
      });
    } catch (err: unknown) {
      // ✅ 에러 로깅
      if (err instanceof Error) {
        this.logger.error(`❌ 주문 생성 중 오류: ${err.message}`, err.stack);
      } else {
        this.logger.error('❌ 알 수 없는 오류 발생', JSON.stringify(err));
      }

      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }

      throw new InternalServerErrorException(
        '주문 생성 중 오류가 발생했습니다.',
      );
    }
  }
}
