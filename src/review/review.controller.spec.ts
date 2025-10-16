import { Test, TestingModule } from '@nestjs/testing';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { CreateReviewDto, UpdateReviewDto } from './review.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { AuthUser } from 'src/auth/auth.types';
import { UserType } from '@prisma/client';

describe('ReviewController', () => {
  let controller: ReviewController;
  let service: jest.Mocked<ReviewService>;

  const mockService: jest.Mocked<ReviewService> = {
    create: jest.fn(),
    findAllByProductId: jest.fn(),
    findReviewById: jest.fn(),
    updateReview: jest.fn(),
    deleteReview: jest.fn(),
  } as any;

  const mockAuthUser: AuthUser = {
    userId: 'user1',
    email: 'user@test.com',
    type: UserType.BUYER,
    points: 0,
    grade: {
      id: 'grade1',
      name: 'Bronze',
      rate: 0,
      minAmount: 0,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewController],
      providers: [{ provide: ReviewService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ReviewController>(ReviewController);
    service = module.get(ReviewService) as any;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create - POST /api/product/:productId/reviews', () => {
    const productId = 'product1';
    const createDto: CreateReviewDto = {
      rating: 5,
      content: 'Excellent product!',
    };

    it('정상적으로 리뷰를 생성해야 합니다', async () => {
      const mockCreatedReview = {
        id: 'review1',
        rating: 5,
        content: 'Excellent product!',
        userId: 'user1',
        productId: 'product1',
        createdAt: new Date(),
      };

      service.create.mockResolvedValue(mockCreatedReview as any);

      const req = { user: mockAuthUser };
      const result = await controller.create(req, productId, createDto);

      expect(service.create).toHaveBeenCalledWith({
        ...createDto,
        userId: 'user1',
        productId: 'product1',
      });
      expect(result).toEqual(mockCreatedReview);
    });

    it('JwtAuthGuard가 적용되어야 합니다', () => {
      const guards = Reflect.getMetadata('__guards__', controller.create);
      expect(guards).toBeDefined();
    });

    it('사용자 정보를 요청에서 추출해야 합니다', async () => {
      const mockCreatedReview = {
        id: 'review1',
        rating: 5,
        content: 'Excellent product!',
        userId: 'user1',
        productId: 'product1',
        createdAt: new Date(),
      };

      service.create.mockResolvedValue(mockCreatedReview as any);

      const req = { user: mockAuthUser };
      await controller.create(req, productId, createDto);

      expect(service.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
        }),
      );
    });

    it('productId를 파라미터에서 추출해야 합니다', async () => {
      const mockCreatedReview = {
        id: 'review1',
        rating: 5,
        content: 'Excellent product!',
        userId: 'user1',
        productId: 'product1',
        createdAt: new Date(),
      };

      service.create.mockResolvedValue(mockCreatedReview as any);

      const req = { user: mockAuthUser };
      await controller.create(req, productId, createDto);

      expect(service.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'product1',
        }),
      );
    });
  });

  describe('findAllByProductId - GET /api/product/:productId/reviews', () => {
    const productId = 'product1';

    it('정상적으로 리뷰 목록을 반환해야 합니다', async () => {
      const mockReviews = [
        {
          id: 'review1',
          rating: 5,
          content: 'Great!',
          userId: 'user2',
          createdAt: new Date(),
        },
        {
          id: 'review2',
          rating: 4,
          content: 'Good!',
          userId: 'user3',
          createdAt: new Date(),
        },
      ];

      service.findAllByProductId.mockResolvedValue(mockReviews as any);

      const req = { user: mockAuthUser };
      const result = await controller.findAllByProductId(req, productId, 5, 1);

      expect(service.findAllByProductId).toHaveBeenCalledWith('user1', 'product1', {
        limit: 5,
        page: 1,
      });
      expect(result).toEqual(mockReviews);
    });

    it('기본 limit(5)와 page(1)를 사용해야 합니다', async () => {
      service.findAllByProductId.mockResolvedValue([]);

      const req = { user: mockAuthUser };
      await controller.findAllByProductId(req, productId, undefined, undefined);

      expect(service.findAllByProductId).toHaveBeenCalledWith('user1', 'product1', {
        limit: 5,
        page: 1,
      });
    });

    it('커스텀 limit과 page를 사용할 수 있어야 합니다', async () => {
      service.findAllByProductId.mockResolvedValue([]);

      const req = { user: mockAuthUser };
      await controller.findAllByProductId(req, productId, 10, 3);

      expect(service.findAllByProductId).toHaveBeenCalledWith('user1', 'product1', {
        limit: 10,
        page: 3,
      });
    });

    it('limit만 제공된 경우 기본 page(1)를 사용해야 합니다', async () => {
      service.findAllByProductId.mockResolvedValue([]);

      const req = { user: mockAuthUser };
      await controller.findAllByProductId(req, productId, 20, undefined);

      expect(service.findAllByProductId).toHaveBeenCalledWith('user1', 'product1', {
        limit: 20,
        page: 1,
      });
    });

    it('page만 제공된 경우 기본 limit(5)를 사용해야 합니다', async () => {
      service.findAllByProductId.mockResolvedValue([]);

      const req = { user: mockAuthUser };
      await controller.findAllByProductId(req, productId, undefined, 2);

      expect(service.findAllByProductId).toHaveBeenCalledWith('user1', 'product1', {
        limit: 5,
        page: 2,
      });
    });
  });

  describe('findReviewById - GET /api/review/:reviewId', () => {
    const reviewId = 'review1';

    it('정상적으로 리뷰를 반환해야 합니다', async () => {
      const mockReview = {
        id: 'review1',
        rating: 5,
        content: 'Great product!',
        userId: 'user1',
        createdAt: new Date(),
      };

      service.findReviewById.mockResolvedValue(mockReview as any);

      const req = { user: mockAuthUser };
      const result = await controller.findReviewById(req, reviewId);

      expect(service.findReviewById).toHaveBeenCalledWith('user1', 'review1');
      expect(result).toEqual(mockReview);
    });

    it('사용자 정보를 요청에서 추출해야 합니다', async () => {
      const mockReview = {
        id: 'review1',
        rating: 5,
        content: 'Great product!',
        userId: 'user1',
        createdAt: new Date(),
      };

      service.findReviewById.mockResolvedValue(mockReview as any);

      const req = { user: mockAuthUser };
      await controller.findReviewById(req, reviewId);

      expect(service.findReviewById).toHaveBeenCalledWith('user1', reviewId);
    });
  });

  describe('updateReview - PATCH /api/review/:reviewId', () => {
    const reviewId = 'review1';
    const updateDto: UpdateReviewDto = {
      rating: 4,
      content: 'Updated content here.',
    };

    it('정상적으로 리뷰를 수정해야 합니다', async () => {
      const mockUpdatedReview = {
        id: 'review1',
        rating: 4,
        content: 'Updated content here.',
        userId: 'user1',
        productId: 'product1',
        createdAt: new Date(),
      };

      service.updateReview.mockResolvedValue(mockUpdatedReview as any);

      const req = { user: mockAuthUser };
      const result = await controller.updateReview(req, reviewId, updateDto);

      expect(service.updateReview).toHaveBeenCalledWith('user1', 'review1', updateDto);
      expect(result).toEqual(mockUpdatedReview);
    });

    it('JwtAuthGuard가 적용되어야 합니다', () => {
      const guards = Reflect.getMetadata('__guards__', controller.updateReview);
      expect(guards).toBeDefined();
    });

    it('사용자 정보를 요청에서 추출해야 합니다', async () => {
      const mockUpdatedReview = {
        id: 'review1',
        rating: 4,
        content: 'Updated content here.',
        userId: 'user1',
        productId: 'product1',
        createdAt: new Date(),
      };

      service.updateReview.mockResolvedValue(mockUpdatedReview as any);

      const req = { user: mockAuthUser };
      await controller.updateReview(req, reviewId, updateDto);

      expect(service.updateReview).toHaveBeenCalledWith('user1', reviewId, updateDto);
    });
  });

  describe('deleteReview - DELETE /api/review/:reviewId', () => {
    const reviewId = 'review1';

    it('정상적으로 리뷰를 삭제해야 합니다', async () => {
      const mockDeletedReview = {
        id: 'review1',
        content: 'Great product!',
      };

      service.deleteReview.mockResolvedValue(mockDeletedReview as any);

      const req = { user: mockAuthUser };
      const result = await controller.deleteReview(req, reviewId);

      expect(service.deleteReview).toHaveBeenCalledWith('user1', 'review1');
      expect(result).toEqual(mockDeletedReview);
    });

    it('JwtAuthGuard가 적용되어야 합니다', () => {
      const guards = Reflect.getMetadata('__guards__', controller.deleteReview);
      expect(guards).toBeDefined();
    });

    it('사용자 정보를 요청에서 추출해야 합니다', async () => {
      const mockDeletedReview = {
        id: 'review1',
        content: 'Great product!',
      };

      service.deleteReview.mockResolvedValue(mockDeletedReview as any);

      const req = { user: mockAuthUser };
      await controller.deleteReview(req, reviewId);

      expect(service.deleteReview).toHaveBeenCalledWith('user1', reviewId);
    });
  });
});