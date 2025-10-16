import { Test, TestingModule } from '@nestjs/testing';
import { ReviewRepository } from './review.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './review.dto';

describe('ReviewRepository', () => {
  let repository: ReviewRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrisma = {
    review: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    order: {
      findFirst: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<ReviewRepository>(ReviewRepository);
    prisma = module.get(PrismaService) as any;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('정상적으로 리뷰를 생성해야 합니다', async () => {
      const createDto = {
        rating: 5,
        content: 'Great product!',
        userId: 'user1',
        productId: 'product1',
      };
      const mockCreatedReview = {
        id: 'review1',
        rating: 5,
        content: 'Great product!',
        userId: 'user1',
        productId: 'product1',
        createdAt: new Date(),
      };

      mockPrisma.review.create.mockResolvedValue(mockCreatedReview as any);

      const result = await repository.create(createDto);

      expect(mockPrisma.review.create).toHaveBeenCalledWith({
        data: createDto,
        select: {
          id: true,
          rating: true,
          content: true,
          userId: true,
          productId: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(mockCreatedReview);
    });

    it('올바른 필드만 선택해서 반환해야 합니다', async () => {
      const createDto = {
        rating: 5,
        content: 'Great product!',
        userId: 'user1',
        productId: 'product1',
      };

      mockPrisma.review.create.mockResolvedValue({} as any);

      await repository.create(createDto);

      expect(mockPrisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            id: true,
            rating: true,
            content: true,
            userId: true,
            productId: true,
            createdAt: true,
          }),
        }),
      );
    });
  });

  describe('findOrderByCondition', () => {
    it('사용자와 상품에 해당하는 주문을 찾아야 합니다', async () => {
      const userId = 'user1';
      const productId = 'product1';
      const mockOrder = {
        id: 'order1',
        userId: 'user1',
        items: [{ productId: 'product1' }],
      };

      mockPrisma.order.findFirst.mockResolvedValue(mockOrder as any);

      const result = await repository.findOrderByCondition(userId, productId);

      expect(mockPrisma.order.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          items: {
            some: {
              productId,
            },
          },
        },
      });
      expect(result).toEqual(mockOrder);
    });

    it('조건에 맞는 주문이 없으면 null을 반환해야 합니다', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      const result = await repository.findOrderByCondition('user1', 'product1');

      expect(result).toBeNull();
    });
  });

  describe('findReviewByCondition', () => {
    it('사용자와 상품에 해당하는 리뷰를 찾아야 합니다', async () => {
      const userId = 'user1';
      const productId = 'product1';
      const mockReview = {
        id: 'review1',
        userId: 'user1',
        productId: 'product1',
      };

      mockPrisma.review.findFirst.mockResolvedValue(mockReview as any);

      const result = await repository.findReviewByCondition(userId, productId);

      expect(mockPrisma.review.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          productId,
        },
      });
      expect(result).toEqual(mockReview);
    });

    it('조건에 맞는 리뷰가 없으면 null을 반환해야 합니다', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(null);

      const result = await repository.findReviewByCondition('user1', 'product1');

      expect(result).toBeNull();
    });
  });

  describe('findProductById', () => {
    it('상품 ID로 상품을 찾아야 합니다', async () => {
      const productId = 'product1';
      const mockProduct = {
        id: 'product1',
        name: 'Test Product',
      };

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct as any);

      const result = await repository.findProductById(productId);

      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(result).toEqual(mockProduct);
    });

    it('상품이 없으면 null을 반환해야 합니다', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const result = await repository.findProductById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findAllByProductId', () => {
    const productId = 'product1';
    const query = { limit: 5, page: 1 };

    it('정상적으로 리뷰 목록을 반환해야 합니다', async () => {
      const mockReviews = [
        {
          id: 'review1',
          rating: 5,
          content: 'Great!',
          userId: 'user1',
          createdAt: new Date(),
        },
        {
          id: 'review2',
          rating: 4,
          content: 'Good!',
          userId: 'user2',
          createdAt: new Date(),
        },
      ];

      mockPrisma.review.findMany.mockResolvedValue(mockReviews as any);

      const result = await repository.findAllByProductId(productId, query);

      expect(mockPrisma.review.findMany).toHaveBeenCalledWith({
        where: { productId },
        select: {
          id: true,
          rating: true,
          content: true,
          userId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        skip: 0,
      });
      expect(result).toEqual(mockReviews);
    });

    it('페이지네이션을 올바르게 계산해야 합니다', async () => {
      mockPrisma.review.findMany.mockResolvedValue([]);

      await repository.findAllByProductId(productId, { limit: 10, page: 3 });

      expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20, // (page - 1) * limit = (3 - 1) * 10 = 20
        }),
      );
    });

    it('최신순으로 정렬해야 합니다', async () => {
      mockPrisma.review.findMany.mockResolvedValue([]);

      await repository.findAllByProductId(productId, query);

      expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('기본 limit(5)를 사용해야 합니다', async () => {
      mockPrisma.review.findMany.mockResolvedValue([]);

      await repository.findAllByProductId(productId, { limit: undefined, page: 1 } as any);

      expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });
  });

  describe('findReviewById', () => {
    it('리뷰 ID로 리뷰를 찾아야 합니다', async () => {
      const reviewId = 'review1';
      const mockReview = {
        id: 'review1',
        rating: 5,
        content: 'Great!',
        userId: 'user1',
        createdAt: new Date(),
      };

      mockPrisma.review.findUnique.mockResolvedValue(mockReview as any);

      const result = await repository.findReviewById(reviewId);

      expect(mockPrisma.review.findUnique).toHaveBeenCalledWith({
        where: { id: reviewId },
        select: {
          id: true,
          rating: true,
          content: true,
          userId: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(mockReview);
    });

    it('리뷰가 없으면 null을 반환해야 합니다', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(null);

      const result = await repository.findReviewById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateReview', () => {
    const reviewId = 'review1';
    const updateDto: UpdateReviewDto = {
      rating: 4,
      content: 'Updated content',
    };

    it('정상적으로 리뷰를 수정해야 합니다', async () => {
      const mockUpdatedReview = {
        id: 'review1',
        rating: 4,
        content: 'Updated content',
        userId: 'user1',
        productId: 'product1',
        createdAt: new Date(),
      };

      mockPrisma.review.update.mockResolvedValue(mockUpdatedReview as any);

      const result = await repository.updateReview(reviewId, updateDto);

      expect(mockPrisma.review.update).toHaveBeenCalledWith({
        where: { id: reviewId },
        data: updateDto,
        select: {
          id: true,
          rating: true,
          content: true,
          userId: true,
          productId: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(mockUpdatedReview);
    });

    it('부분 업데이트를 지원해야 합니다', async () => {
      const partialUpdate = { rating: 3 };

      mockPrisma.review.update.mockResolvedValue({} as any);

      await repository.updateReview(reviewId, partialUpdate);

      expect(mockPrisma.review.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: partialUpdate,
        }),
      );
    });
  });

  describe('deleteReview', () => {
    it('정상적으로 리뷰를 삭제해야 합니다', async () => {
      const reviewId = 'review1';
      const mockDeletedReview = {
        id: 'review1',
        content: 'Great product!',
      };

      mockPrisma.review.delete.mockResolvedValue(mockDeletedReview as any);

      const result = await repository.deleteReview(reviewId);

      expect(mockPrisma.review.delete).toHaveBeenCalledWith({
        where: { id: reviewId },
        select: {
          id: true,
          content: true,
        },
      });
      expect(result).toEqual(mockDeletedReview);
    });

    it('삭제된 리뷰의 id와 content만 반환해야 합니다', async () => {
      mockPrisma.review.delete.mockResolvedValue({} as any);

      await repository.deleteReview('review1');

      expect(mockPrisma.review.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            id: true,
            content: true,
          },
        }),
      );
    });
  });
});