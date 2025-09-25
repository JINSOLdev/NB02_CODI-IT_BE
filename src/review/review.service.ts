import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateReviewDto } from './review.dto';
import { ReviewRepository } from './review.repository';

@Injectable()
export class ReviewService {
  constructor(private reviewRepository: ReviewRepository) { }

  create(createReviewDto: CreateReviewDto & { userId: string; productId: string }) {
    return this.reviewRepository.create({ ...createReviewDto });
  }

  async updateReview(userId: string, reviewId: string, rating?: number, content?: string) {
    const existingReview = await this.reviewRepository.findReviewById(reviewId);
    if (!existingReview) throw new NotFoundException('요청한 리소스를 찾을 수 없습니다.');
    if (existingReview.userId !== userId) throw new UnauthorizedException('권한이 없습니다.');

    return this.reviewRepository.updateReview(reviewId, rating, content);
  }
}
