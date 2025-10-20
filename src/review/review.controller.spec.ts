import { Test, TestingModule } from '@nestjs/testing';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

// ReviewController Tests
describe('ReviewController', () => {
  let controller: ReviewController;
  let service: jest.Mocked<ReviewService>;
  const userId = 'user-123';
  const productId = 'product-123';
  const reviewId = 'review-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewController],
      providers: [
        {
          provide: ReviewService,
          useValue: {
            createReview: jest.fn(),
            findAllByProductId: jest.fn(),
            findReviewById: jest.fn(),
            updateReview: jest.fn(),
            deleteReview: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReviewController>(ReviewController);
    service = module.get(ReviewService);
  });

  describe('createReview', () => {
    it('리뷰 생성 호출 시 service.createReview에 올바른 인자 전달', async () => {
      const dto = { rating: 5, content: 'Great product!' };
      const mockResult = { id: reviewId, ...dto, userId, productId };
      service.createReview.mockResolvedValue(mockResult as any);

      const result = await controller.createReview({ user: { userId } } as any, productId, dto);

      expect(service.createReview).toHaveBeenCalledWith({
        ...dto,
        userId,
        productId,
      });
      expect(result).toBe(mockResult);
    });

    it('req.user에서 userId 추출하여 전달', async () => {
      const dto = { rating: 3, content: 'Average product' };
      service.createReview.mockResolvedValue({} as any);

      await controller.createReview({ user: { userId: 'different-user' } } as any, productId, dto);

      expect(service.createReview).toHaveBeenCalledWith({
        ...dto,
        userId: 'different-user',
        productId,
      });
    });

    it('service에서 에러 발생 시 에러 전파', async () => {
      const dto = { rating: 5, content: 'Great product!' };
      service.createReview.mockRejectedValue(
        new UnauthorizedException('이미 리뷰를 작성한 상품입니다.'),
      );

      await expect(
        controller.createReview({ user: { userId } } as any, productId, dto),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('findAllByProductId', () => {
    it('상품별 리뷰 조회: 쿼리 파싱 후 service.findAllByProductId 호출', async () => {
      const mockResult = [{ id: 'r1' }];
      service.findAllByProductId.mockResolvedValue(mockResult as any);

      const res = await controller.findAllByProductId(productId, '10', '2');

      expect(service.findAllByProductId).toHaveBeenCalledWith(productId, { limit: 10, page: 2 });
      expect(res).toBe(mockResult);
    });

    it('쿼리 파라미터가 없을 때 기본값 사용', async () => {
      const mockResult = [];
      service.findAllByProductId.mockResolvedValue(mockResult as any);

      await controller.findAllByProductId(productId, undefined, undefined);

      expect(service.findAllByProductId).toHaveBeenCalledWith(productId, { limit: 5, page: 1 });
    });

    it('잘못된 쿼리 파라미터일 때 기본값 사용', async () => {
      service.findAllByProductId.mockResolvedValue([] as any);

      await controller.findAllByProductId(productId, 'invalid', 'invalid');

      expect(service.findAllByProductId).toHaveBeenCalledWith(productId, { limit: 5, page: 1 });
    });

    it('음수 또는 0인 쿼리 파라미터일 때 기본값 사용', async () => {
      service.findAllByProductId.mockResolvedValue([] as any);

      await controller.findAllByProductId(productId, '-5', '0');

      expect(service.findAllByProductId).toHaveBeenCalledWith(productId, { limit: 5, page: 1 });
    });
  });

  describe('findReviewById', () => {
    it('단건 리뷰 조회: userId 전달 후 service.findReviewById 호출', async () => {
      const mockReview = { id: reviewId, userId };
      service.findReviewById.mockResolvedValue(mockReview as any);

      const res = await controller.findReviewById({ user: { userId } } as any, reviewId);

      expect(service.findReviewById).toHaveBeenCalledWith(userId, reviewId);
      expect(res).toBe(mockReview);
    });

    it('존재하지 않는 리뷰 조회 시 에러 전파', async () => {
      service.findReviewById.mockRejectedValue(
        new NotFoundException('요청한 리소스를 찾을 수 없습니다.'),
      );

      await expect(
        controller.findReviewById({ user: { userId } } as any, reviewId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateReview', () => {
    it('리뷰 수정: service.updateReview 호출', async () => {
      const updateDto = { rating: 4, content: 'Updated content' };
      const mockResult = { id: reviewId, ...updateDto };
      service.updateReview.mockResolvedValue(mockResult as any);

      const result = await controller.updateReview(
        { user: { userId } } as any,
        reviewId,
        updateDto,
      );

      expect(service.updateReview).toHaveBeenCalledWith(userId, reviewId, updateDto);
      expect(result).toBe(mockResult);
    });

    it('부분 수정 시 전달받은 필드만 업데이트', async () => {
      const updateDto = { rating: 5 };
      service.updateReview.mockResolvedValue({} as any);

      await controller.updateReview({ user: { userId } } as any, reviewId, updateDto);

      expect(service.updateReview).toHaveBeenCalledWith(userId, reviewId, updateDto);
    });

    it('권한 없는 사용자가 수정 시도 시 에러 전파', async () => {
      const updateDto = { rating: 4 };
      service.updateReview.mockRejectedValue(new UnauthorizedException('인증이 필요합니다.'));

      await expect(
        controller.updateReview({ user: { userId } } as any, reviewId, updateDto),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('deleteReview', () => {
    it('리뷰 삭제: service.deleteReview 호출', async () => {
      const mockResult = { id: reviewId, content: 'Deleted review' };
      service.deleteReview.mockResolvedValue(mockResult as any);

      const result = await controller.deleteReview({ user: { userId } } as any, reviewId);

      expect(service.deleteReview).toHaveBeenCalledWith(userId, reviewId);
      expect(result).toBe(mockResult);
    });

    it('권한 없는 사용자가 삭제 시도 시 에러 전파', async () => {
      service.deleteReview.mockRejectedValue(new UnauthorizedException('인증이 필요합니다.'));

      await expect(controller.deleteReview({ user: { userId } } as any, reviewId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
