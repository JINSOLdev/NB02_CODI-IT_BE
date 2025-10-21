import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { ReviewRepository } from './review.repository';
import { ReviewService } from './review.service';

// ReviewService Tests
describe('ReviewService', () => {
  let service: ReviewService;
  let repository: jest.Mocked<ReviewRepository>;
  const userId = 'user-123';
  const productId = 'product-456';
  const reviewId = 'review-789';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        {
          provide: ReviewRepository,
          useValue: {
            createReview: jest.fn(),
            findOrderByCondition: jest.fn(),
            findReviewByCondition: jest.fn(),
            findProductById: jest.fn(),
            findAllByProductId: jest.fn(),
            findReviewById: jest.fn(),
            updateReview: jest.fn(),
            deleteReview: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
    repository = module.get(ReviewRepository);
  });

  describe('createReview', () => {
    it('정상적인 리뷰 생성', async () => {
      const createDto = { userId, productId, rating: 5, content: 'Great product!' };
      const mockOrder = { id: 'order-1', userId };
      const mockResult = { id: reviewId, ...createDto };

      repository.findOrderByCondition.mockResolvedValue(mockOrder as any);
      repository.findReviewByCondition.mockResolvedValue(null);
      repository.createReview.mockResolvedValue(mockResult as any);

      const result = await service.createReview(createDto);

      expect(repository.findOrderByCondition).toHaveBeenCalledWith(userId, productId);
      expect(repository.findReviewByCondition).toHaveBeenCalledWith(userId, productId);
      expect(repository.createReview).toHaveBeenCalledWith(userId, productId, 5, 'Great product!');
      expect(result).toBe(mockResult);
    });

    it('구매하지 않은 상품에 리뷰 작성 시 에러', async () => {
      const createDto = { userId, productId, rating: 5, content: 'Great product!' };
      repository.findOrderByCondition.mockResolvedValue(null);

      await expect(service.createReview(createDto)).rejects.toThrow(
        new UnauthorizedException('해당 상품을 구매한 사용자만 리뷰를 작성할 수 있습니다.'),
      );
    });

    it('이미 리뷰 작성한 상품에 재작성 시 에러', async () => {
      const createDto = { userId, productId, rating: 5, content: 'Great product!' };
      const mockOrder = { id: 'order-1', userId };
      const existingReview = { id: 'existing-review', userId, productId };

      repository.findOrderByCondition.mockResolvedValue(mockOrder as any);
      repository.findReviewByCondition.mockResolvedValue(existingReview as any);

      await expect(service.createReview(createDto)).rejects.toThrow(
        new UnauthorizedException('이미 리뷰를 작성한 상품입니다.'),
      );
    });
  });

  describe('findAllByProductId', () => {
    it('정상적인 상품별 리뷰 목록 조회', async () => {
      const query = { limit: 10, page: 1 };
      const mockProduct = { id: productId, name: 'Test Product' };
      const mockReviews = [
        { id: 'r1', rating: 5 },
        { id: 'r2', rating: 4 },
      ];

      repository.findProductById.mockResolvedValue(mockProduct as any);
      repository.findAllByProductId.mockResolvedValue(mockReviews as any);

      const result = await service.findAllByProductId(productId, query);

      expect(repository.findProductById).toHaveBeenCalledWith(productId);
      expect(repository.findAllByProductId).toHaveBeenCalledWith(productId, query);
      expect(result).toBe(mockReviews);
    });

    it('존재하지 않는 상품 조회 시 에러', async () => {
      const query = { limit: 10, page: 1 };
      repository.findProductById.mockResolvedValue(null);

      await expect(service.findAllByProductId(productId, query)).rejects.toThrow(
        new NotFoundException('요청한 리소스를 찾을 수 없습니다.'),
      );
    });
  });

  describe('findReviewById', () => {
    it('정상적인 리뷰 단건 조회', async () => {
      const mockReview = { id: reviewId, userId, rating: 5 };
      repository.findReviewById.mockResolvedValue(mockReview as any);

      const result = await service.findReviewById(userId, reviewId);

      expect(repository.findReviewById).toHaveBeenCalledWith(reviewId);
      expect(result).toBe(mockReview);
    });

    it('존재하지 않는 리뷰 조회 시 에러', async () => {
      repository.findReviewById.mockResolvedValue(null);

      await expect(service.findReviewById(userId, reviewId)).rejects.toThrow(
        new NotFoundException('요청한 리소스를 찾을 수 없습니다.'),
      );
    });

    it('다른 사용자 리뷰 조회 시 에러', async () => {
      const mockReview = { id: reviewId, userId: 'other-user', rating: 5 };
      repository.findReviewById.mockResolvedValue(mockReview as any);

      await expect(service.findReviewById(userId, reviewId)).rejects.toThrow(
        new UnauthorizedException('인증이 필요합니다.'),
      );
    });
  });

  describe('updateReview', () => {
    it('정상적인 리뷰 수정', async () => {
      const updateDto = { rating: 4, content: 'Updated content' };
      const existingReview = { id: reviewId, userId, rating: 5, content: 'Old content' };
      const updatedReview = { ...existingReview, ...updateDto };

      repository.findReviewById.mockResolvedValue(existingReview as any);
      repository.updateReview.mockResolvedValue(updatedReview as any);

      const result = await service.updateReview(userId, reviewId, updateDto);

      expect(repository.findReviewById).toHaveBeenCalledWith(reviewId);
      expect(repository.updateReview).toHaveBeenCalledWith(reviewId, updatedReview);
      expect(result).toBe(updatedReview);
    });

    it('부분 수정 - rating만 업데이트', async () => {
      const updateDto = { rating: 4 };
      const existingReview = { id: reviewId, userId, rating: 5, content: 'Content' };
      const expectedUpdate = { ...existingReview, rating: 4 };

      repository.findReviewById.mockResolvedValue(existingReview as any);
      repository.updateReview.mockResolvedValue(expectedUpdate as any);

      await service.updateReview(userId, reviewId, updateDto);

      expect(repository.updateReview).toHaveBeenCalledWith(reviewId, expectedUpdate);
    });

    it('다른 사용자 리뷰 수정 시도 시 에러', async () => {
      const updateDto = { rating: 4 };
      const existingReview = { id: reviewId, userId: 'other-user', rating: 5 };
      repository.findReviewById.mockResolvedValue(existingReview as any);

      await expect(service.updateReview(userId, reviewId, updateDto)).rejects.toThrow(
        new UnauthorizedException('인증이 필요합니다.'),
      );
    });
  });

  describe('deleteReview', () => {
    it('정상적인 리뷰 삭제', async () => {
      const existingReview = { id: reviewId, userId, rating: 5 };
      const deleteResult = { id: reviewId, content: 'Deleted' };

      repository.findReviewById.mockResolvedValue(existingReview as any);
      repository.deleteReview.mockResolvedValue(deleteResult as any);

      const result = await service.deleteReview(userId, reviewId);

      expect(repository.findReviewById).toHaveBeenCalledWith(reviewId);
      expect(repository.deleteReview).toHaveBeenCalledWith(reviewId);
      expect(result).toBe(deleteResult);
    });

    it('존재하지 않는 리뷰 삭제 시 에러', async () => {
      repository.findReviewById.mockResolvedValue(null);

      await expect(service.deleteReview(userId, reviewId)).rejects.toThrow(
        new NotFoundException('요청한 리소스를 찾을 수 없습니다.'),
      );
    });

    it('다른 사용자 리뷰 삭제 시도 시 에러', async () => {
      const existingReview = { id: reviewId, userId: 'other-user', rating: 5 };
      repository.findReviewById.mockResolvedValue(existingReview as any);

      await expect(service.deleteReview(userId, reviewId)).rejects.toThrow(
        new UnauthorizedException('인증이 필요합니다.'),
      );
    });
  });

  describe('validateReviewOwner', () => {
    it('유효한 리뷰 소유자 검증', async () => {
      const mockReview = { id: reviewId, userId, rating: 5 };
      repository.findReviewById.mockResolvedValue(mockReview as any);

      const result = await service['validateReviewOwner'](userId, reviewId);

      expect(result).toBe(mockReview);
    });
  });
});
