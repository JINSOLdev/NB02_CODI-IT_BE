import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ForbiddenException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderStatus, PaymentStatus, UserType } from '@prisma/client';
import type { AuthUser } from '../auth/auth.types';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: jest.Mocked<
    Pick<
      OrdersService,
      | 'createOrder'
      | 'updateOrder'
      | 'cancelOrder'
      | 'getOrders'
      | 'getOrderDetail'
    >
  >;

  const mockBuyer: AuthUser = {
    userId: 'buyer_1',
    email: 'buyer@test.com',
    type: UserType.BUYER,
    points: 1000,
    grade: {
      id: 'grade_1',
      name: 'GREEN',
      rate: 0.01,
      minAmount: 0,
    },
  };

  const mockSeller: AuthUser = {
    userId: 'seller_1',
    email: 'seller@test.com',
    type: UserType.SELLER,
    points: 500,
    grade: {
      id: 'grade_2',
      name: 'ORANGE',
      rate: 0.02,
      minAmount: 10000,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: {
            createOrder: jest.fn(),
            updateOrder: jest.fn(),
            cancelOrder: jest.fn(),
            getOrders: jest.fn(),
            getOrderDetail: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get(OrdersService);
  });

  // 🛒 주문 생성
  describe('createOrder', () => {
    it('✅ 구매자가 정상 주문 생성', async () => {
      const dto: CreateOrderDto = {
        name: '홍길동',
        phone: '010-1234-5678',
        address: '서울특별시 강남구',
        orderItems: [{ productId: 'p1', sizeId: 3, quantity: 1 }],
        usePoint: 0,
      };

      const mockOrder: OrderResponseDto = {
        id: 'order_1',
        status: OrderStatus.PROCESSING,
        name: dto.name,
        phone: dto.phone,
        address: dto.address,
        subtotal: 10000,
        totalQuantity: 1,
        usePoint: 0,
        createdAt: new Date(),
        orderItems: [],
        payments: {
          id: 'payment_1',
          price: 10000,
          status: PaymentStatus.COMPLETED,
          createdAt: new Date(),
          updatedAt: new Date(),
          orderId: 'order_1',
        },
      };

      service.createOrder.mockResolvedValue(mockOrder);

      const result = await controller.createOrder({ user: mockBuyer }, dto);

      expect(service.createOrder).toHaveBeenCalledWith(mockBuyer.userId, dto);
      expect(result).toEqual(mockOrder);
    });

    it('🚫 판매자가 주문 생성 시 ForbiddenException 발생', () => {
      const invalidDto: CreateOrderDto = {
        name: '',
        phone: '',
        address: '',
        orderItems: [],
        usePoint: 0,
      };

      expect(() =>
        controller.createOrder({ user: mockSeller }, invalidDto),
      ).toThrow(ForbiddenException);
    });
  });

  // ✏️ 주문 수정
  describe('updateOrder', () => {
    it('✅ 구매자가 주문 수정', async () => {
      const dto: UpdateOrderDto = { status: OrderStatus.PROCESSING };

      const mockUpdated: OrderResponseDto = {
        id: 'order_1',
        status: OrderStatus.PROCESSING,
        name: '홍길동',
        phone: '010-1234-5678',
        address: '서울특별시 강남구',
        subtotal: 10000,
        totalQuantity: 1,
        usePoint: 0,
        createdAt: new Date(),
        orderItems: [],
        payments: {
          id: 'payment_1',
          price: 10000,
          status: PaymentStatus.COMPLETED,
          createdAt: new Date(),
          updatedAt: new Date(),
          orderId: 'order_1',
        },
      };

      service.updateOrder.mockResolvedValue(mockUpdated);

      const result = await controller.updateOrder(
        { user: mockBuyer },
        'order_1',
        dto,
      );

      expect(service.updateOrder).toHaveBeenCalledWith(
        'order_1',
        mockBuyer.userId,
        dto,
      );
      expect(result).toEqual(mockUpdated);
    });

    it('🚫 판매자는 수정 불가', () => {
      const invalidDto: UpdateOrderDto = { status: OrderStatus.PROCESSING };

      expect(() =>
        controller.updateOrder({ user: mockSeller }, 'order_1', invalidDto),
      ).toThrow(ForbiddenException);
    });
  });

  // ❌ 주문 취소
  describe('cancelOrder', () => {
    it('✅ 구매자가 주문 취소', async () => {
      service.cancelOrder.mockResolvedValue({
        message: '주문이 성공적으로 취소되었습니다.',
      });

      const result = await controller.cancelOrder(
        { user: mockBuyer },
        'order_1',
      );

      expect(service.cancelOrder).toHaveBeenCalledWith(
        'order_1',
        mockBuyer.userId,
      );
      expect(result).toEqual({ message: '주문이 성공적으로 취소되었습니다.' });
    });

    it('🚫 판매자는 취소 불가', () => {
      expect(() =>
        controller.cancelOrder({ user: mockSeller }, 'order_1'),
      ).toThrow(ForbiddenException);
    });
  });

  // 📦 주문 목록 조회
  describe('getOrders', () => {
    it('✅ 구매자 주문 목록 반환', async () => {
      const query: GetOrdersQueryDto = { page: 1, limit: 10 };

      const mockOrders = {
        data: [
          {
            id: 'o1',
            status: OrderStatus.PROCESSING,
            name: '홍길동',
            phone: '010-1',
            address: '서울',
            subtotal: 5000,
            totalQuantity: 1,
            usePoint: 0,
            createdAt: new Date(),
            orderItems: [],
            payments: {
              id: 'pay1',
              price: 5000,
              status: PaymentStatus.COMPLETED,
              createdAt: new Date(),
              updatedAt: new Date(),
              orderId: 'o1',
            },
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      service.getOrders.mockResolvedValue(mockOrders);

      const result = await controller.getOrders({ user: mockBuyer }, query);

      expect(service.getOrders).toHaveBeenCalledWith(mockBuyer.userId, query);
      expect(result).toEqual(mockOrders);
    });

    it('🚫 판매자는 조회 불가', () => {
      expect(() =>
        controller.getOrders({ user: mockSeller }, { page: 1, limit: 10 }),
      ).toThrow(ForbiddenException);
    });
  });

  // 🔍 주문 상세 조회
  describe('getOrderDetail', () => {
    it('✅ 구매자 주문 상세 반환', async () => {
      const mockDetail: OrderResponseDto = {
        id: 'order_1',
        status: OrderStatus.PROCESSING,
        name: '홍길동',
        phone: '010-1111-2222',
        address: '서울',
        subtotal: 15000,
        totalQuantity: 1,
        usePoint: 0,
        createdAt: new Date(),
        orderItems: [],
        payments: {
          id: 'payment_1',
          price: 15000,
          status: PaymentStatus.COMPLETED,
          createdAt: new Date(),
          updatedAt: new Date(),
          orderId: 'order_1',
        },
      };

      service.getOrderDetail.mockResolvedValue(mockDetail);

      const result = await controller.getOrderDetail(
        { user: mockBuyer },
        'order_1',
      );

      expect(service.getOrderDetail).toHaveBeenCalledWith(
        'order_1',
        mockBuyer.userId,
      );
      expect(result).toEqual(mockDetail);
    });

    it('🚫 판매자는 상세 조회 불가', () => {
      expect(() =>
        controller.getOrderDetail({ user: mockSeller }, 'order_1'),
      ).toThrow(ForbiddenException);
    });
  });
});
