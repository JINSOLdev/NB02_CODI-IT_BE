import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ReviewRepository } from './review.repository';
import { CreateReviewDto } from './review.dto';

@Injectable()
export class ReviewService {
  constructor(private reviewRepository: ReviewRepository) { }

  // Review 등록
  create(createReviewDto: CreateReviewDto & { userId: string; productId: string }) {
    return this.reviewRepository.create({ ...createReviewDto });
  }

  // Product에 해당하는 Review 목록 조회
  async findAllByProductId(userId: string, productId: string, query: { limit: number; page: number }) {
    const product = await this.reviewRepository.findProductById(productId);
    if (!product) throw new NotFoundException('요청한 리소스를 찾을 수 없습니다.');

    return this.reviewRepository.findAllByProductId(productId, query);
  }

  // Review 단건 조회
  async findReviewById(reviewId: string) {
    const existingReview = await this.reviewRepository.findReviewById(reviewId);
    if (!existingReview) throw new NotFoundException('요청한 리소스를 찾을 수 없습니다.');

    return this.reviewRepository.findReviewById(reviewId);
  }

  // Review 수정
  async updateReview(userId: string, reviewId: string, rating?: number, content?: string) {
    const existingReview = await this.reviewRepository.findReviewById(reviewId);
    if (!existingReview) throw new NotFoundException('요청한 리소스를 찾을 수 없습니다.');
    if (existingReview.userId !== userId) throw new UnauthorizedException('권한이 없습니다.');

    return this.reviewRepository.updateReview(reviewId, rating, content);
  }

  // Review 삭제
  async deleteReview(userId: string, reviewId: string) {
    const existingReview = await this.reviewRepository.findReviewById(reviewId);
    if (!existingReview) throw new NotFoundException('요청한 리소스를 찾을 수 없습니다.');
    if (existingReview.userId !== userId) throw new UnauthorizedException('인증이 필요합니다.');

    return this.reviewRepository.deleteReview(reviewId);
  }
}
