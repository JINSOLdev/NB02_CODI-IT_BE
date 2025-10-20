import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from '../cart.service';
import { CartRepository } from '../cart.repository';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

describe('CartService', () => {
  let cartService: CartService;
  let cartRepository: CartRepository;

  beforeEach(async () => {
    const mockCartRepository = {
      createOrGetCart: jest.fn(),
      getCartByBuyerId: jest.fn(),
      getCartIdByBuyerId: jest.fn(),
      createOrUpdateCartItemAndReturnCart: jest.fn(),
      getCartItem: jest.fn(),
      deleteCartItem: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: CartRepository, useValue: mockCartRepository },
      ],
    }).compile();

    cartService = module.get<CartService>(CartService);
    cartRepository = module.get<CartRepository>(CartRepository);
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
        items: [],
      };

      //레포 목킹
      (cartRepository.getCartIdByBuyerId as jest.Mock).mockResolvedValue(
        mockCart,
      );
      (
        cartRepository.createOrUpdateCartItemAndReturnCart as jest.Mock
      ).mockResolvedValue(mockCart);

      //서비스 테스트
      const response = await cartService.createOrUpdateCartItemAndReturnCart(
        buyerId,
        {
          productId: 'product1',
          sizes: [
            {
              sizeId: 'size1',
              quantity: 1,
            },
          ],
        },
      );
      expect(response).toEqual(mockCart);
    });

    it('장바구니 수정 실패', async () => {
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
