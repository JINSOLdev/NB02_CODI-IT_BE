import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from '../cart.service';
import { CartRepository } from '../cart.repository';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

describe('CartService', () => {
  let cartService: CartService;
  let cartRepository: CartRepository;
  let prisma: PrismaService;

  beforeEach(async () => {
    const mockCartRepository = {
      createOrGetCart: jest.fn(),
      getCartByBuyerId: jest.fn(),
      upsertCartItem: jest.fn(),
      findCartWithItems: jest.fn(),
      updateCartTotalQuantity: jest.fn(),
      executeTransaction: jest.fn(),
      getCartItem: jest.fn(),
      deleteCartItem: jest.fn(),
    };

    const mockPrisma = {
      product: {
        findUnique: jest.fn(),
      },
      stockSize: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: CartRepository, useValue: mockCartRepository },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    cartService = module.get<CartService>(CartService);
    cartRepository = module.get<CartRepository>(CartRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(cartService).toBeDefined();
    expect(cartRepository).toBeDefined();
  });

  describe('장바구니 생성', () => {
    it('장바구니 생성', async () => {
      const buyerId = 'user123';
      const mockCart = {
        id: 'cart1',
        buyerId,
        quantity: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        buyer: {
          id: buyerId,
          name: 'user123',
          email: 'user123',
          passwordHash: 'user123',
          type: 'BUYER',
          image: 'user123',
          points: 0,
          gradeLevel: 'GREEN',
          createdAt: new Date('2025-10-16T14:08:32.000Z'),
          updatedAt: new Date('2025-10-16T14:08:32.000Z'),
          deletedAt: null,
        },
        items: [],
      };

      //레포 목킹
      (cartRepository.createOrGetCart as jest.Mock).mockResolvedValue(mockCart);

      //서비스 테스트
      const response = await cartService.createCart(buyerId);
      expect(response).toEqual(mockCart);
    });

    it('장바구니 생성 실패', async () => {
      await expect(cartService.createCart('')).rejects.toThrow(
        BadRequestException,
      );
      await expect(cartService.createCart(null as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('장바구니 조회', () => {
    it('장바구니 조회', async () => {
      const buyerId = 'user123';
      const mockCart = {
        id: 'cart1',
        buyerId,
        quantity: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        buyer: {
          id: buyerId,
          name: 'user123',
          email: 'user123',
          passwordHash: 'user123',
          type: 'BUYER',
          image: 'user123',
          points: 0,
          gradeLevel: 'GREEN',
          createdAt: new Date('2025-10-16T14:08:32.000Z'),
          updatedAt: new Date('2025-10-16T14:08:32.000Z'),
          deletedAt: null,
        },
        items: [],
      };

      //레포 목킹
      (cartRepository.getCartByBuyerId as jest.Mock).mockResolvedValue(
        mockCart,
      );

      //서비스 테스트
      const response = await cartService.getCart(buyerId);
      expect(response).toEqual(mockCart);
    });

    it('장바구니 비어있음', async () => {
      (cartRepository.getCartByBuyerId as jest.Mock).mockResolvedValue(null);
      const result = await cartService.getCart('user음23');
      expect(result).toEqual([]);
    });
  });

  describe('장바구니 수정', () => {
    it('장바구니 수정', async () => {
      const buyerId = 'user123';
      const mockCart = {
        id: 'cart1',
        buyerId,
        quantity: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        buyer: {
          id: buyerId,
          name: 'user123',
          email: 'user123',
          passwordHash: 'user123',
          type: 'BUYER',
          image: 'user123',
          points: 0,
          gradeLevel: 'GREEN',
          createdAt: new Date('2025-10-16T14:08:32.000Z'),
          updatedAt: new Date('2025-10-16T14:08:32.000Z'),
          deletedAt: null,
        },
        items: [{ id: 'cartItem1', quantity: 1 }],
      };

      const mockUpdatedCart = {
        id: 'cart1',
        buyerId,
        quantity: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        buyer: {
          id: buyerId,
          name: 'user123',
          email: 'user123',
          passwordHash: 'user123',
          type: 'BUYER',
          image: 'user123',
          points: 0,
          gradeLevel: 'GREEN',
          createdAt: new Date('2025-10-16T14:08:32.000Z'),
          updatedAt: new Date('2025-10-16T14:08:32.000Z'),
          deletedAt: null,
        },
        items: [{ id: 'cartItem1', quantity: 2 }],
      };

      //레포 목킹
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'product1',
        name: '테스트 상품',
        price: 10000,
      });
      (prisma.stockSize.findUnique as jest.Mock).mockResolvedValue({
        id: 'size1',
        name: 'M',
      });
      (cartRepository.getCartByBuyerId as jest.Mock).mockImplementation(() => {
        return Promise.resolve(mockCart);
      });
      (cartRepository.upsertCartItem as jest.Mock).mockImplementation(() => {
        mockCart.items = [{ id: 'cartItem1', quantity: 2 }];
        return Promise.resolve(mockCart);
      });
      (cartRepository.findCartWithItems as jest.Mock).mockResolvedValue(
        mockCart,
      );

      (cartRepository.updateCartTotalQuantity as jest.Mock).mockImplementation(
        () => {
          mockCart.quantity = 2;
          return Promise.resolve(mockCart);
        },
      );

      (cartRepository.executeTransaction as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback({} as unknown as any);
        },
      );

      //서비스 테스트
      const response = await cartService.createOrUpdateCartItemAndReturnCart(
        buyerId,
        {
          productId: 'product1',
          sizes: [
            {
              sizeId: 'size1',
              quantity: 2,
            },
          ],
        },
      );
      expect(response).toEqual(mockUpdatedCart);
    });

    it('장바구니 수정 실패(buyerId 없음)', async () => {
      await expect(
        cartService.createOrUpdateCartItemAndReturnCart('', {
          productId: 'product1',
          sizes: [
            {
              sizeId: 'size1',
              quantity: 1,
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  it('장바구니 수정 실패(productId 없음)', async () => {
    await expect(
      cartService.createOrUpdateCartItemAndReturnCart('user123', {
        productId: '',
        sizes: [
          {
            sizeId: 'size1',
            quantity: 1,
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('장바구니 수정 실패(sizeId 없음)', async () => {
    await expect(
      cartService.createOrUpdateCartItemAndReturnCart('user123', {
        productId: 'product1',
        sizes: [
          {
            sizeId: '',
            quantity: 1,
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  describe('장바구니 아이템 조회', () => {
    it('장바구니 아이템 조회', async () => {
      const buyerId = 'user123';
      const cartItemId = 'cartItem1';
      const mockCartItem = {
        id: cartItemId,
        cartId: 'cart1',
        productId: 'product1',
        sizeId: 'size1',
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        cart: {
          id: 'cart1',
          buyerId,
          quantity: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          buyer: {
            id: 'user123',
            name: 'user123',
            email: 'user123',
            passwordHash: 'user123',
            type: 'BUYER',
            image: 'user123',
            points: 0,
            gradeLevel: 'GREEN',
            createdAt: new Date('2025-10-16T14:08:32.000Z'),
            updatedAt: new Date('2025-10-16T14:08:32.000Z'),
            deletedAt: null,
          },
        },
      };

      //레포 목킹
      (cartRepository.getCartItem as jest.Mock).mockResolvedValue(mockCartItem);

      //서비스 테스트
      const response = await cartService.getCartItem(buyerId, cartItemId);
      expect(response).toEqual(mockCartItem);
    });

    it('장바구니 아이템 조회 실패', async () => {
      await expect(cartService.getCartItem('user123', '')).rejects.toThrow(
        NotFoundException,
      );
      await expect(cartService.getCartItem('', 'cartItem1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('장바구니 아이템 조회 실패(인증되지 않은 사용자)', async () => {
      const mockCartItem = {
        id: 'cartItem1',
        cartId: 'cart1',
        productId: 'product1',
        sizeId: 'size1',
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        cart: {
          id: 'cart1',
          buyerId: 'user123',
          quantity: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          buyer: {
            id: 'user123',
            name: 'user123',
            email: 'user123',
            passwordHash: 'user123',
            type: 'BUYER',
            image: 'user123',
            points: 0,
            gradeLevel: 'GREEN',
            createdAt: new Date('2025-10-16T14:08:32.000Z'),
            updatedAt: new Date('2025-10-16T14:08:32.000Z'),
            deletedAt: null,
          },
          items: [],
        },
      };
      (cartRepository.getCartItem as jest.Mock).mockResolvedValue(mockCartItem);
      await expect(
        cartService.getCartItem('forbidden', 'cartItem1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('장바구니 아이템 삭제', () => {
    it('장바구니 아이템 삭제', async () => {
      const buyerId = 'user123';
      const cartItemId = 'cartItem1';
      const mockCartItem = {
        id: cartItemId,
        cartId: 'cart1',
        productId: 'product1',
        sizeId: 'size1',
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        cart: {
          id: 'cart1',
          buyerId,
          quantity: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          buyer: {
            id: 'user123',
            name: 'user123',
            email: 'user123',
            passwordHash: 'user123',
            type: 'BUYER',
            image: 'user123',
            points: 0,
            gradeLevel: 'GREEN',
            createdAt: new Date('2025-10-16T14:08:32.000Z'),
            updatedAt: new Date('2025-10-16T14:08:32.000Z'),
            deletedAt: null,
          },
        },
      };

      //레포 목킹
      (cartRepository.getCartItem as jest.Mock).mockResolvedValue(mockCartItem);
      (cartRepository.deleteCartItem as jest.Mock).mockResolvedValue(
        mockCartItem,
      );

      //서비스 테스트
      const response = await cartService.deleteCartItem(buyerId, cartItemId);
      expect(response).toEqual(mockCartItem);
    });

    it('장바구니 아이템 삭제 실패', async () => {
      await expect(cartService.deleteCartItem('user123', '')).rejects.toThrow(
        NotFoundException,
      );
      await expect(cartService.deleteCartItem('', 'cartItem1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('장바구니 아이템 삭제 실패(인증되지 않은 사용자)', async () => {
      const cartItemId = 'cartItem1';
      const mockCartItem = {
        id: cartItemId,
        cartId: 'cart1',
        productId: 'product1',
        sizeId: 'size1',
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        cart: {
          id: 'cart1',
          buyerId: 'user123',
          quantity: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          buyer: {
            id: 'user123',
            name: 'user123',
            email: 'user123',
            passwordHash: 'user123',
            type: 'BUYER',
            image: 'user123',
            points: 0,
            gradeLevel: 'GREEN',
            createdAt: new Date('2025-10-16T14:08:32.000Z'),
            updatedAt: new Date('2025-10-16T14:08:32.000Z'),
            deletedAt: null,
          },
        },
      };
      (cartRepository.getCartItem as jest.Mock).mockResolvedValue(mockCartItem);
      await expect(
        cartService.deleteCartItem('forbidden', 'cartItem1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
