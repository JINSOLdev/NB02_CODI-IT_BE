import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ReviewRepository } from './review.repository';
import { CreateReviewDto, UpdateReviewDto } from './review.dto';

@Injectable()
export class ReviewService {
  constructor(private reviewRepository: ReviewRepository) { }

  // 권한 체크 메서드 분리
  private async validateReviewOwner(userId: string, reviewId: string) {
    const review = await this.reviewRepository.findReviewById(reviewId);
    if (!review)
      throw new NotFoundException('요청한 리소스를 찾을 수 없습니다.');
    if (review.userId !== userId)
      throw new UnauthorizedException('인증이 필요합니다.');
    return review;
  }

  // Review 등록
  async createReview(
    createReviewDto: CreateReviewDto & { userId: string; productId: string },
  ) {
    const { userId, productId, rating, content } = createReviewDto;
    const order = await this.reviewRepository.findOrderByCondition(
      userId,
      productId,
    );
    if (!order)
      throw new UnauthorizedException(
        '해당 상품을 구매한 사용자만 리뷰를 작성할 수 있습니다.',
      );

    const existingReview = await this.reviewRepository.findReviewByCondition(
      userId,
      productId,
    );

    if (existingReview)
      throw new UnauthorizedException('이미 리뷰를 작성한 상품입니다.');

    return this.reviewRepository.createReview(
      userId,
      productId,
      rating,
      content,
    );
  }

  // Product에 해당하는 Review 목록 조회
  async findAllByProductId(
    productId: string,
    query: { limit: number; page: number },
  ) {
    const product = await this.reviewRepository.findProductById(productId);
    if (!product)
      throw new NotFoundException('요청한 리소스를 찾을 수 없습니다.');

    const result = await this.reviewRepository.findAllByProductId(
      productId,
      query,
    );
    const formatResult = {
      items: result.items,
      meta: {
        total: result.total,
        page: query.page,
        limit: query.limit,
        hasNextPage:
          (query.page - 1) * query.limit + result.items.length < result.total,
      },
    };

    return formatResult;
  }
  // Review 단건 조회
  async findReviewById(userId: string, reviewId: string) {
    return this.validateReviewOwner(userId, reviewId);
  }

  // Review 수정
  async updateReview(
    userId: string,
    reviewId: string,
    updateReviewDto: UpdateReviewDto,
  ) {
    const existingReview = await this.validateReviewOwner(userId, reviewId);

    const { rating, content } = updateReviewDto;
    const updatedReview = { ...existingReview };
    if (rating !== undefined) updatedReview.rating = rating;
    if (content !== undefined) updatedReview.content = content;

    return this.reviewRepository.updateReview(reviewId, updatedReview);
  }

  // Review 삭제
  async deleteReview(userId: string, reviewId: string) {
    await this.validateReviewOwner(userId, reviewId);
    return this.reviewRepository.deleteReview(reviewId);
  }
}
