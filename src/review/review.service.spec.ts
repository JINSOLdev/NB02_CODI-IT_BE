import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './review.service';
import { ReviewRepository } from './review.repository';
import { CreateReviewDto, UpdateReviewDto } from './review.dto';
import {
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

describe('ReviewService', () => {
  let service: ReviewService;
  let repo: jest.Mocked<ReviewRepository>;

  const mockRepo: jest.Mocked<ReviewRepository> = {
    create: jest.fn(),
    findOrderByCondition: jest.fn(),
    findReviewByCondition: jest.fn(),
    findProductById: jest.fn(),
    findAllByProductId: jest.fn(),
    findReviewById: jest.fn(),
    updateReview: jest.fn(),
    deleteReview: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: ReviewRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
    repo = module.get(ReviewRepository) as any;
    jest.clearAllMocks();
  });

  describe('create - Review 등록', () => {
    const createDto: CreateReviewDto & { userId: string; productId: string } = {
      rating: 5,
      content: 'Great product! Highly recommend.',
      userId: 'user1',
      productId: 'product1',
    };

    it('정상적으로 리뷰를 생성해야 합니다', async () => {
      const mockOrder = { id: 'order1', userId: 'user1' };
      const mockCreatedReview = {
        id: 'review1',
        rating: 5,
        content: 'Great product! Highly recommend.',
        userId: 'user1',
        productId: 'product1',
        createdAt: new Date(),
      };

      repo.findOrderByCondition.mockResolvedValue(mockOrder as any);
      repo.findReviewByCondition.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockCreatedReview as any);

      const result = await service.create(createDto);

      expect(repo.findOrderByCondition).toHaveBeenCalledWith('user1', 'product1');
      expect(repo.findReviewByCondition).toHaveBeenCalledWith('user1', 'product1');
      expect(repo.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockCreatedReview);
    });

    it('구매하지 않은 상품에 대해 UnauthorizedException을 던져야 합니다', async () => {
      repo.findOrderByCondition.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        '해당 상품을 구매한 사용자만 리뷰를 작성할 수 있습니다.',
      );
      expect(repo.findOrderByCondition).toHaveBeenCalledWith('user1', 'product1');
      expect(repo.findReviewByCondition).not.toHaveBeenCalled();
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('이미 리뷰를 작성한 상품에 대해 UnauthorizedException을 던져야 합니다', async () => {
      const mockOrder = { id: 'order1', userId: 'user1' };
      const existingReview = {
        id: 'review1',
        userId: 'user1',
        productId: 'product1',
      };

      repo.findOrderByCondition.mockResolvedValue(mockOrder as any);
      repo.findReviewByCondition.mockResolvedValue(existingReview as any);

      await expect(service.create(createDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        '이미 리뷰를 작성한 상품입니다.',
      );
      expect(repo.findOrderByCondition).toHaveBeenCalledWith('user1', 'product1');
      expect(repo.findReviewByCondition).toHaveBeenCalledWith('user1', 'product1');
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('최소 평점(1점)으로 리뷰를 생성할 수 있어야 합니다', async () => {
      const minRatingDto = { ...createDto, rating: 1 };
      const mockOrder = { id: 'order1' };
      const mockCreatedReview = {
        id: 'review1',
        rating: 1,
        content: 'Great product! Highly recommend.',
        userId: 'user1',
        productId: 'product1',
        createdAt: new Date(),
      };

      repo.findOrderByCondition.mockResolvedValue(mockOrder as any);
      repo.findReviewByCondition.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockCreatedReview as any);

      const result = await service.create(minRatingDto);

      expect(result.rating).toBe(1);
      expect(repo.create).toHaveBeenCalledWith(minRatingDto);
    });

    it('최대 평점(5점)으로 리뷰를 생성할 수 있어야 합니다', async () => {
      const maxRatingDto = { ...createDto, rating: 5 };
      const mockOrder = { id: 'order1' };
      const mockCreatedReview = {
        id: 'review1',
        rating: 5,
        content: 'Great product! Highly recommend.',
        userId: 'user1',
        productId: 'product1',
        createdAt: new Date(),
      };

      repo.findOrderByCondition.mockResolvedValue(mockOrder as any);
      repo.findReviewByCondition.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockCreatedReview as any);

      const result = await service.create(maxRatingDto);

      expect(result.rating).toBe(5);
      expect(repo.create).toHaveBeenCalledWith(maxRatingDto);
    });

    it('최소 길이(10자)의 내용으로 리뷰를 생성할 수 있어야 합니다', async () => {
      const minContentDto = { ...createDto, content: '1234567890' };
      const mockOrder = { id: 'order1' };
      const mockCreatedReview = {
        id: 'review1',
        rating: 5,
        content: '1234567890',
        userId: 'user1',
        productId: 'product1',
        createdAt: new Date(),
      };

      repo.findOrderByCondition.mockResolvedValue(mockOrder as any);
      repo.findReviewByCondition.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockCreatedReview as any);

      const result = await service.create(minContentDto);

      expect(result.content).toBe('1234567890');
      expect(repo.create).toHaveBeenCalledWith(minContentDto);
    });
  });

  describe('findAllByProductId - Product에 해당하는 Review 목록 조회', () => {
    const userId = 'user1';
    const productId = 'product1';
    const query = { limit: 5, page: 1 };

    it('정상적으로 리뷰 목록을 반환해야 합니다', async () => {
      const mockProduct = { id: 'product1', name: 'Test Product' };
      const mockReviews = [
        {
          id: 'review1',
          rating: 5,
          content: 'Great product!',
          userId: 'user2',
          createdAt: new Date(),
        },
        {
          id: 'review2',
          rating: 4,
          content: 'Good product.',
          userId: 'user3',
          createdAt: new Date(),
        },
      ];

      repo.findProductById.mockResolvedValue(mockProduct as any);
      repo.findAllByProductId.mockResolvedValue(mockReviews as any);

      const result = await service.findAllByProductId(userId, productId, query);

      expect(repo.findProductById).toHaveBeenCalledWith(productId);
      expect(repo.findAllByProductId).toHaveBeenCalledWith(productId, query);
      expect(result).toEqual(mockReviews);
      expect(result).toHaveLength(2);
    });

    it('존재하지 않는 상품에 대해 NotFoundException을 던져야 합니다', async () => {
      repo.findProductById.mockResolvedValue(null);

      await expect(
        service.findAllByProductId(userId, productId, query),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findAllByProductId(userId, productId, query),
      ).rejects.toThrow('요청한 리소스를 찾을 수 없습니다.');
      expect(repo.findProductById).toHaveBeenCalledWith(productId);
      expect(repo.findAllByProductId).not.toHaveBeenCalled();
    });

    it('리뷰가 없는 경우 빈 배열을 반환해야 합니다', async () => {
      const mockProduct = { id: 'product1', name: 'Test Product' };

      repo.findProductById.mockResolvedValue(mockProduct as any);
      repo.findAllByProductId.mockResolvedValue([]);

      const result = await service.findAllByProductId(userId, productId, query);

      expect(result).toEqual([]);
      expect(repo.findAllByProductId).toHaveBeenCalledWith(productId, query);
    });

    it('기본 limit(5)와 page(1)로 조회해야 합니다', async () => {
      const mockProduct = { id: 'product1', name: 'Test Product' };
      const mockReviews = [
        { id: 'review1', rating: 5, content: 'Great!', userId: 'user2', createdAt: new Date() },
      ];

      repo.findProductById.mockResolvedValue(mockProduct as any);
      repo.findAllByProductId.mockResolvedValue(mockReviews as any);

      await service.findAllByProductId(userId, productId, { limit: 5, page: 1 });

      expect(repo.findAllByProductId).toHaveBeenCalledWith(productId, { limit: 5, page: 1 });
    });

    it('커스텀 limit과 page로 조회해야 합니다', async () => {
      const mockProduct = { id: 'product1', name: 'Test Product' };
      const customQuery = { limit: 10, page: 2 };

      repo.findProductById.mockResolvedValue(mockProduct as any);
      repo.findAllByProductId.mockResolvedValue([]);

      await service.findAllByProductId(userId, productId, customQuery);

      expect(repo.findAllByProductId).toHaveBeenCalledWith(productId, customQuery);
    });
  });

  describe('findReviewById - Review 단건 조회', () => {
    const userId = 'user1';
    const reviewId = 'review1';

    it('정상적으로 리뷰를 반환해야 합니다', async () => {
      const mockReview = {
        id: 'review1',
        rating: 5,
        content: 'Great product!',
        userId: 'user1',
        createdAt: new Date(),
      };

      repo.findReviewById.mockResolvedValue(mockReview as any);

      const result = await service.findReviewById(userId, reviewId);

      expect(repo.findReviewById).toHaveBeenCalledWith(reviewId);
      expect(result).toEqual(mockReview);
    });

    it('존재하지 않는 리뷰에 대해 NotFoundException을 던져야 합니다', async () => {
      repo.findReviewById.mockResolvedValue(null);

      await expect(service.findReviewById(userId, reviewId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findReviewById(userId, reviewId)).rejects.toThrow(
        '요청한 리소스를 찾을 수 없습니다.',
      );
      expect(repo.findReviewById).toHaveBeenCalledWith(reviewId);
    });

    it('다른 사용자의 리뷰 조회 시 UnauthorizedException을 던져야 합니다', async () => {
      const mockReview = {
        id: 'review1',
        rating: 5,
        content: 'Great product!',
        userId: 'user2',
        createdAt: new Date(),
      };

      repo.findReviewById.mockResolvedValue(mockReview as any);

      await expect(service.findReviewById(userId, reviewId)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.findReviewById(userId, reviewId)).rejects.toThrow(
        '인증이 필요합니다.',
      );
      expect(repo.findReviewById).toHaveBeenCalledWith(reviewId);
    });

    it('본인의 리뷰만 조회할 수 있어야 합니다', async () => {
      const mockReview = {
        id: 'review1',
        rating: 5,
        content: 'Great product!',
        userId: 'user1',
        createdAt: new Date(),
      };

      repo.findReviewById.mockResolvedValue(mockReview as any);

      const result = await service.findReviewById('user1', reviewId);

      expect(result).toEqual(mockReview);
      expect(result.userId).toBe('user1');
    });
  });

  describe('updateReview - Review 수정', () => {
    const userId = 'user1';
    const reviewId = 'review1';
    const updateDto: UpdateReviewDto = {
      rating: 4,
      content: 'Updated content here.',
    };

    it('정상적으로 리뷰를 수정해야 합니다', async () => {
      const existingReview = {
        id: 'review1',
        rating: 5,
        content: 'Original content',
        userId: 'user1',
        createdAt: new Date(),
      };
      const updatedReview = {
        id: 'review1',
        rating: 4,
        content: 'Updated content here.',
        userId: 'user1',
        productId: 'product1',
        createdAt: new Date(),
      };

      repo.findReviewById.mockResolvedValue(existingReview as any);
      repo.updateReview.mockResolvedValue(updatedReview as any);

      const result = await service.updateReview(userId, reviewId, updateDto);

      expect(repo.findReviewById).toHaveBeenCalledWith(reviewId);
      expect(repo.updateReview).toHaveBeenCalledWith(reviewId, updateDto);
      expect(result).toEqual(updatedReview);
    });

    it('존재하지 않는 리뷰 수정 시 NotFoundException을 던져야 합니다', async () => {
      repo.findReviewById.mockResolvedValue(null);

      await expect(
        service.updateReview(userId, reviewId, updateDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateReview(userId, reviewId, updateDto),
      ).rejects.toThrow('요청한 리소스를 찾을 수 없습니다.');
      expect(repo.findReviewById).toHaveBeenCalledWith(reviewId);
      expect(repo.updateReview).not.toHaveBeenCalled();
    });

    it('다른 사용자의 리뷰 수정 시 UnauthorizedException을 던져야 합니다', async () => {
      const existingReview = {
        id: 'review1',
        rating: 5,
        content: 'Original content',
        userId: 'user2',
        createdAt: new Date(),
      };

      repo.findReviewById.mockResolvedValue(existingReview as any);

      await expect(
        service.updateReview(userId, reviewId, updateDto),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.updateReview(userId, reviewId, updateDto),
      ).rejects.toThrow('인증이 필요합니다.');
      expect(repo.findReviewById).toHaveBeenCalledWith(reviewId);
      expect(repo.updateReview).not.toHaveBeenCalled();
    });

    it('평점만 수정할 수 있어야 합니다', async () => {
      const existingReview = {
        id: 'review1',
        rating: 5,
        content: 'Original content',
        userId: 'user1',
        createdAt: new Date(),
      };
      const ratingOnlyUpdate = { rating: 3 };
      const updatedReview = {
        id: 'review1',
        rating: 3,
        content: 'Original content',
        userId: 'user1',
        productId: 'product1',
        createdAt: new Date(),
      };

      repo.findReviewById.mockResolvedValue(existingReview as any);
      repo.updateReview.mockResolvedValue(updatedReview as any);

      const result = await service.updateReview(userId, reviewId, ratingOnlyUpdate);

      expect(repo.updateReview).toHaveBeenCalledWith(reviewId, ratingOnlyUpdate);
      expect(result.rating).toBe(3);
    });

    it('내용만 수정할 수 있어야 합니다', async () => {
      const existingReview = {
        id: 'review1',
        rating: 5,
        content: 'Original content',
        userId: 'user1',
        createdAt: new Date(),
      };
      const contentOnlyUpdate = { content: 'New content only change.' };
      const updatedReview = {
        id: 'review1',
        rating: 5,
        content: 'New content only change.',
        userId: 'user1',
        productId: 'product1',
        createdAt: new Date(),
      };

      repo.findReviewById.mockResolvedValue(existingReview as any);
      repo.updateReview.mockResolvedValue(updatedReview as any);

      const result = await service.updateReview(userId, reviewId, contentOnlyUpdate);

      expect(repo.updateReview).toHaveBeenCalledWith(reviewId, contentOnlyUpdate);
      expect(result.content).toBe('New content only change.');
    });

    it('평점과 내용을 모두 수정할 수 있어야 합니다', async () => {
      const existingReview = {
        id: 'review1',
        rating: 5,
        content: 'Original content',
        userId: 'user1',
        createdAt: new Date(),
      };
      const bothUpdate = { rating: 2, content: 'Both fields updated now.' };
      const updatedReview = {
        id: 'review1',
        rating: 2,
        content: 'Both fields updated now.',
        userId: 'user1',
        productId: 'product1',
        createdAt: new Date(),
      };

      repo.findReviewById.mockResolvedValue(existingReview as any);
      repo.updateReview.mockResolvedValue(updatedReview as any);

      const result = await service.updateReview(userId, reviewId, bothUpdate);

      expect(repo.updateReview).toHaveBeenCalledWith(reviewId, bothUpdate);
      expect(result.rating).toBe(2);
      expect(result.content).toBe('Both fields updated now.');
    });
  });

  describe('deleteReview - Review 삭제', () => {
    const userId = 'user1';
    const reviewId = 'review1';

    it('정상적으로 리뷰를 삭제해야 합니다', async () => {
      const existingReview = {
        id: 'review1',
        rating: 5,
        content: 'Great product!',
        userId: 'user1',
        createdAt: new Date(),
      };
      const deletedReview = {
        id: 'review1',
        content: 'Great product!',
      };

      repo.findReviewById.mockResolvedValue(existingReview as any);
      repo.deleteReview.mockResolvedValue(deletedReview as any);

      const result = await service.deleteReview(userId, reviewId);

      expect(repo.findReviewById).toHaveBeenCalledWith(reviewId);
      expect(repo.deleteReview).toHaveBeenCalledWith(reviewId);
      expect(result).toEqual(deletedReview);
    });

    it('존재하지 않는 리뷰 삭제 시 NotFoundException을 던져야 합니다', async () => {
      repo.findReviewById.mockResolvedValue(null);

      await expect(service.deleteReview(userId, reviewId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deleteReview(userId, reviewId)).rejects.toThrow(
        '요청한 리소스를 찾을 수 없습니다.',
      );
      expect(repo.findReviewById).toHaveBeenCalledWith(reviewId);
      expect(repo.deleteReview).not.toHaveBeenCalled();
    });

    it('다른 사용자의 리뷰 삭제 시 UnauthorizedException을 던져야 합니다', async () => {
      const existingReview = {
        id: 'review1',
        rating: 5,
        content: 'Great product!',
        userId: 'user2',
        createdAt: new Date(),
      };

      repo.findReviewById.mockResolvedValue(existingReview as any);

      await expect(service.deleteReview(userId, reviewId)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.deleteReview(userId, reviewId)).rejects.toThrow(
        '인증이 필요합니다.',
      );
      expect(repo.findReviewById).toHaveBeenCalledWith(reviewId);
      expect(repo.deleteReview).not.toHaveBeenCalled();
    });

    it('본인의 리뷰만 삭제할 수 있어야 합니다', async () => {
      const existingReview = {
        id: 'review1',
        rating: 5,
        content: 'Great product!',
        userId: 'user1',
        createdAt: new Date(),
      };
      const deletedReview = {
        id: 'review1',
        content: 'Great product!',
      };

      repo.findReviewById.mockResolvedValue(existingReview as any);
      repo.deleteReview.mockResolvedValue(deletedReview as any);

      const result = await service.deleteReview('user1', reviewId);

      expect(result).toEqual(deletedReview);
      expect(repo.deleteReview).toHaveBeenCalledWith(reviewId);
    });
  });
});