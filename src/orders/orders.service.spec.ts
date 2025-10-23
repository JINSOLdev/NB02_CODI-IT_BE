import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { PointsService } from '../points/points.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  Prisma,
  PaymentStatus,
  OrderStatus,
  UserType,
  GradeLevel,
  User,
} from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

/**
 * ✅ mockUser (Prisma User 타입 완전 대응)
 */

const mockUser: User = {
  id: 'user1',
  email: 'buyer@test.com',
  name: '홍길동',
  passwordHash: 'hashed_pw',
  type: UserType.BUYER,
  image: null,
  points: 1000,
  gradeLevel: GradeLevel.GREEN,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

/**
 * ✅ mockProduct (readonly 제거 — 완전 타입 일치)
 */

const mockProduct = {
  id: 'p1',
  storeId: 'store1',
  name: '상품1',
  price: 10000,
  image: null,
  content: '상품설명',
  discountPrice: null,
  discountRate: 0,
  discountStartTime: null,
  discountEndTime: null,
  sales: 0,
  categoryId: 'cat1',
  createdAt: new Date(),
  updatedAt: new Date(),
  store: {
    id: 'store1',
    name: '스토어1',
    image: null,
    address: '서울 강남구',
    content: '스토어설명',
    detailAddress: '101호',
    phoneNumber: '010-0000-0000',
    sellerId: 'seller1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  stocks: [
    {
      id: 'stock1',
      productId: 'p1',
      sizeId: 'size1',
      quantity: 10,
      size: { id: 'size1', name: 'M' },
    },
  ],
};

/**
 * ✅ mockOrderListWithRelations (Prisma 반환 구조와 동일)
 */

const mockOrderListWithRelations = [
  {
    id: 'order1',
    userId: 'user1',
    storeId: 'store1',
    recipientName: '홍길동',
    recipientPhone: '010-0000-0000',
    address: '서울 강남구',
    subtotal: 10000,
    totalQuantity: 1,
    usePoint: 0,
    totalPrice: 10000,
    status: OrderStatus.PROCESSING,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: 'item1',
        orderId: 'order1',
        price: 10000,
        productId: 'p1',
        quantity: 1,
        product: mockProduct,
      },
    ],
    payments: {
      id: 'pay1',
      price: 10000,
      status: PaymentStatus.PENDING,
      createdAt: new Date(),
      orderId: 'order1',
    },
  },
] as const satisfies Awaited<
  ReturnType<OrdersRepository['findOrdersByUser']>
>['orders'];

describe('OrdersService', () => {
  let service: OrdersService;
  let ordersRepository: jest.Mocked<OrdersRepository>;
  let pointsService: jest.Mocked<
    PointsService & {
      getMyPointSummary(
        this: void,
        userId: string,
      ): Promise<{
        points: number;
        gradeLevel: GradeLevel;
        lifetimePurchase: number;
        earnRate: number;
        nextGrade: GradeLevel | undefined;
        needToNext: number | undefined;
      }>;
      spendPointsForOrder(
        this: void,
        userId: string,
        orderId: string,
        amount: number,
      ): Promise<void>;
      earnPointsOnPaidOrder(this: void, orderId: string): Promise<void>;
      revertOnCancel(this: void, orderId: string): Promise<void>;
    }
  >;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: OrdersRepository,
          useValue: {
            findUserById: jest.fn(),
            findProductsWithRelations: jest.fn(),
            findOrderById: jest.fn(),
            findOrdersByUser: jest.fn(),
            updateOrder: jest.fn(),
            $transaction: jest.fn(),
          },
        },
        {
          provide: PointsService,
          useValue: {
            spendPointsForOrder: jest.fn(),
            revertOnCancel: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(OrdersService);
    ordersRepository = module.get(OrdersRepository);
    pointsService = module.get(PointsService);
  });

  afterEach(() => jest.clearAllMocks());

  // -------------------------
  // 🧩 createOrder
  // -------------------------
  describe('createOrder', () => {
    const createDto: CreateOrderDto = {
      name: '홍길동',
      phone: '010-0000-0000',
      address: '서울 강남구',
      usePoint: 0,
      orderItems: [{ productId: 'p1', sizeId: 1, quantity: 1 }],
    };

    it('✅ 정상 생성', async () => {
      ordersRepository.findUserById.mockResolvedValue(mockUser);
      ordersRepository.findProductsWithRelations.mockResolvedValue([
        mockProduct,
      ]);

      ordersRepository.$transaction.mockImplementation(
        async (cb: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
          const tx = {
            order: { create: jest.fn().mockResolvedValue({ id: 'order1' }) },
            orderItem: { createMany: jest.fn() },
            payment: { create: jest.fn().mockResolvedValue({ id: 'pay1' }) },
          } as unknown as Prisma.TransactionClient;
          return cb(tx);
        },
      );

      ordersRepository.findOrderById.mockResolvedValue(
        mockOrderListWithRelations[0] as unknown as Awaited<
          ReturnType<OrdersRepository['findOrderById']>
        >,
      );

      const result = await service.createOrder('user1', createDto);
      expect(result.id).toBe('order1');
    });

    it('🚫 유저 없음 → NotFoundException', async () => {
      ordersRepository.findUserById.mockResolvedValue(null);
      await expect(service.createOrder('user1', createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('🚫 포인트 초과 → BadRequestException', async () => {
      ordersRepository.findUserById.mockResolvedValue({
        ...mockUser,
        points: 0,
      });
      await expect(
        service.createOrder('user1', { ...createDto, usePoint: 100 }),
      ).rejects.toThrow(BadRequestException);
    });
  });
  it('🚫 서로 다른 스토어 상품 → BadRequestException', async () => {
    const diffStoreProductA = { ...mockProduct, storeId: 'storeA' };
    const diffStoreProductB = { ...mockProduct, id: 'p2', storeId: 'storeB' };

    ordersRepository.findUserById.mockResolvedValue(mockUser);
    ordersRepository.findProductsWithRelations.mockResolvedValue([
      diffStoreProductA,
      diffStoreProductB,
    ]);

    const dto: CreateOrderDto = {
      name: '홍길동',
      phone: '010-0000-0000',
      address: '서울 강남구',
      usePoint: 0,
      orderItems: [
        { productId: 'p1', sizeId: 1, quantity: 1 },
        { productId: 'p2', sizeId: 1, quantity: 1 },
      ],
    };

    await expect(service.createOrder('user1', dto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('🚫 트랜잭션 중 오류 발생 → InternalServerErrorException', async () => {
    ordersRepository.findUserById.mockResolvedValue(mockUser);
    ordersRepository.findProductsWithRelations.mockResolvedValue([mockProduct]);

    // ✅ async 제거
    ordersRepository.$transaction.mockImplementation(() => {
      throw new Error('DB failure');
    });

    const dto: CreateOrderDto = {
      name: '홍길동',
      phone: '010-0000-0000',
      address: '서울 강남구',
      usePoint: 0,
      orderItems: [{ productId: 'p1', sizeId: 1, quantity: 1 }],
    };

    await expect(service.createOrder('user1', dto)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
  // ✅ 포인트 사용 성공
  it('✅ 포인트 사용 성공 → spendPointsForOrder 호출', async () => {
    ordersRepository.findUserById.mockResolvedValue(mockUser);
    ordersRepository.findProductsWithRelations.mockResolvedValue([mockProduct]);
    ordersRepository.$transaction.mockImplementation(async (cb) => {
      const tx = {
        order: { create: jest.fn().mockResolvedValue({ id: 'order1' }) },
        orderItem: { createMany: jest.fn() },
        payment: { create: jest.fn().mockResolvedValue({ id: 'pay1' }) },
      } as unknown as Prisma.TransactionClient;
      return cb(tx);
    });
    ordersRepository.findOrderById.mockResolvedValue(
      mockOrderListWithRelations[0] as unknown as Awaited<
        ReturnType<OrdersRepository['findOrderById']>
      >,
    );

    const dto: CreateOrderDto = {
      name: '홍길동',
      phone: '010-1111-1111',
      address: '서울 강남구',
      usePoint: 500,
      orderItems: [{ productId: 'p1', sizeId: 1, quantity: 1 }],
    };

    await service.createOrder('user1', dto);

    expect(pointsService.spendPointsForOrder).toHaveBeenCalledWith(
      'user1',
      'order1',
      500,
    );
  });

  // 🚫 상품 개수 불일치 → BadRequestException
  it('🚫 상품 개수 불일치 → BadRequestException', async () => {
    ordersRepository.findUserById.mockResolvedValue(mockUser);
    ordersRepository.findProductsWithRelations.mockResolvedValue([]); // 상품 없음

    const dto: CreateOrderDto = {
      name: '홍길동',
      phone: '010-0000-0000',
      address: '서울 강남구',
      usePoint: 0,
      orderItems: [{ productId: 'p1', sizeId: 1, quantity: 1 }],
    };

    await expect(service.createOrder('user1', dto)).rejects.toThrow(
      BadRequestException,
    );
  });

  // 🚫 서로 다른 스토어 상품 → BadRequestException
  it('🚫 서로 다른 스토어 상품 → BadRequestException', async () => {
    const anotherProduct = { ...mockProduct, storeId: 'store2' };

    ordersRepository.findUserById.mockResolvedValue(mockUser);
    ordersRepository.findProductsWithRelations.mockResolvedValue([
      mockProduct,
      anotherProduct,
    ]);

    const dto: CreateOrderDto = {
      name: '홍길동',
      phone: '010-0000-0000',
      address: '서울 강남구',
      usePoint: 0,
      orderItems: [
        { productId: 'p1', sizeId: 1, quantity: 1 },
        { productId: 'p2', sizeId: 1, quantity: 1 },
      ],
    };

    await expect(service.createOrder('user1', dto)).rejects.toThrow(
      BadRequestException,
    );
  });

  // -------------------------
  // ✏️ updateOrder
  // -------------------------
  describe('updateOrder', () => {
    const updateDto: UpdateOrderDto = {
      name: '변경된 이름',
      phone: '010-9999-9999',
      address: '서울특별시 마포구',
      usePoint: 0,
    };

    it('✅ 정상 수정', async () => {
      const mockOrder = { ...mockOrderListWithRelations[0], userId: 'user1' };
      ordersRepository.findOrderById.mockResolvedValue(
        mockOrder as unknown as Awaited<
          ReturnType<OrdersRepository['findOrderById']>
        >,
      );
      ordersRepository.updateOrder.mockResolvedValue({
        ...mockOrder,
        recipientName: updateDto.name,
      } as unknown as Awaited<ReturnType<OrdersRepository['updateOrder']>>);

      const result = await service.updateOrder('order1', 'user1', updateDto);
      expect(result.id).toBe('order1');
    });

    it('🚫 주문 없음 → NotFoundException', async () => {
      ordersRepository.findOrderById.mockResolvedValue(null);
      await expect(
        service.updateOrder('order1', 'user1', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('🚫 본인 주문 아님 → ForbiddenException', async () => {
      const mockOrder = { ...mockOrderListWithRelations[0], userId: 'other' };
      ordersRepository.findOrderById.mockResolvedValue(
        mockOrder as unknown as Awaited<
          ReturnType<OrdersRepository['findOrderById']>
        >,
      );
      await expect(
        service.updateOrder('order1', 'user1', updateDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // -------------------------
  // ❌ cancelOrder
  // -------------------------
  describe('cancelOrder', () => {
    const mockOrder = {
      ...mockOrderListWithRelations[0],
      status: OrderStatus.PROCESSING,
    };

    it('✅ 정상 취소', async () => {
      const revertSpy = jest
        .spyOn(pointsService, 'revertOnCancel')
        .mockResolvedValue();

      ordersRepository.findOrderById.mockResolvedValue(
        mockOrder as unknown as Awaited<
          ReturnType<OrdersRepository['findOrderById']>
        >,
      );
      ordersRepository.$transaction.mockImplementation(
        async (cb: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
          const tx = {
            order: { update: jest.fn() },
            payment: { update: jest.fn() },
          } as unknown as Prisma.TransactionClient;
          return cb(tx);
        },
      );

      const result = await service.cancelOrder('order1', 'user1');
      expect(result.message).toBe('주문이 취소되었습니다.');
      expect(revertSpy).toHaveBeenCalledWith('order1');
    });

    it('🚫 상태 PROCESSING 아님 → BadRequestException', async () => {
      ordersRepository.findOrderById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELED,
      } as unknown as Awaited<ReturnType<OrdersRepository['findOrderById']>>);
      await expect(service.cancelOrder('order1', 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('🚫 주문 없음 → NotFoundException', async () => {
      ordersRepository.findOrderById.mockResolvedValue(null);
      await expect(service.cancelOrder('order1', 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
  it('🚫 포인트 복원 실패 → InternalServerErrorException', async () => {
    // ✅ 1️⃣ 반환 타입을 정확히 지정
    type OrderWithRelations = Awaited<
      ReturnType<OrdersRepository['findOrderById']>
    >;

    // ✅ 2️⃣ mockOrder의 타입을 명확히 지정
    const mockOrder: OrderWithRelations = {
      ...mockOrderListWithRelations[0],
      userId: 'user1',
    } as OrderWithRelations;

    // ✅ 3️⃣ 타입 일치 → as any 제거
    ordersRepository.findOrderById.mockResolvedValue(mockOrder);

    // ✅ 4️⃣ 나머지는 동일
    ordersRepository.$transaction.mockImplementation(() => Promise.resolve());
    pointsService.revertOnCancel.mockRejectedValue(
      new Error('포인트 복원 실패'),
    );

    await expect(service.cancelOrder('order1', 'user1')).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  // -------------------------
  // 📦 getOrders
  // -------------------------
  describe('getOrders', () => {
    it('✅ 정상 조회', async () => {
      ordersRepository.findUserById.mockResolvedValue(mockUser);
      ordersRepository.findOrdersByUser.mockResolvedValue({
        orders: mockOrderListWithRelations,
        total: 1,
      });
      const result = await service.getOrders('user1', { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('🚫 유저 없음 → NotFoundException', async () => {
      ordersRepository.findUserById.mockResolvedValue(null);
      await expect(
        service.getOrders('user1', { page: 1, limit: 10 }),
      ).rejects.toThrow(NotFoundException);
    });
  });
  it('✅ status 필터 적용 시 해당 상태만 반환', async () => {
    const mockCanceledOrder = {
      ...mockOrderListWithRelations[0],
      id: 'orderCanceled',
      status: OrderStatus.CANCELED,
    };

    ordersRepository.findUserById.mockResolvedValue(mockUser);
    ordersRepository.findOrdersByUser.mockResolvedValue({
      orders: [mockCanceledOrder],
      total: 1,
    });

    const result = await service.getOrders('user1', {
      page: 1,
      limit: 10,
      status: OrderStatus.CANCELED,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].status).toBe(OrderStatus.CANCELED);
  });

  it('✅ 페이지네이션 계산 검증 (page, limit, totalPages)', async () => {
    ordersRepository.findUserById.mockResolvedValue(mockUser);
    ordersRepository.findOrdersByUser.mockResolvedValue({
      orders: Array<
        Awaited<
          ReturnType<OrdersRepository['findOrdersByUser']>
        >['orders'][number]
      >(5).fill(mockOrderListWithRelations[0]),
      total: 23,
    });

    const result = await service.getOrders('user1', { page: 3, limit: 5 });

    // ✅ meta 검증
    expect(result.meta.page).toBe(3);
    expect(result.meta.limit).toBe(5);
    expect(result.meta.total).toBe(23);
    expect(result.meta.totalPages).toBe(5); // Math.ceil(23 / 5)

    // ✅ 데이터 길이 검증
    expect(result.data).toHaveLength(5);
  });
  // -------------------------
  // 🔍 getOrderDetail
  // -------------------------
  describe('getOrderDetail', () => {
    const mockOrder = {
      ...mockOrderListWithRelations[0],
      userId: 'user1',
    };

    it('✅ 정상 조회', async () => {
      ordersRepository.findOrderById.mockResolvedValue(
        mockOrder as unknown as Awaited<
          ReturnType<OrdersRepository['findOrderById']>
        >,
      );
      const result = await service.getOrderDetail('order1', 'user1');
      expect(result.id).toBe('order1');
      // ✅ DTO 매핑된 필드 검사 (recipientName → name)
      expect(result.name).toBe('홍길동');
    });

    it('🚫 본인 주문 아님 → ForbiddenException', async () => {
      ordersRepository.findOrderById.mockResolvedValue({
        ...mockOrder,
        userId: 'other',
      } as unknown as Awaited<ReturnType<OrdersRepository['findOrderById']>>);
      await expect(service.getOrderDetail('order1', 'user1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
