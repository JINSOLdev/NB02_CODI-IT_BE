import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ReviewRepository } from './review.repository';
import { CreateReviewDto, UpdateReviewDto } from './review.dto';

@Injectable()
export class ReviewService {
  constructor(private reviewRepository: ReviewRepository) { }

  // Review 등록
  async create(createReviewDto: CreateReviewDto & { userId: string; productId: string }) {
    const order = await this.reviewRepository.findOrderByCondition(createReviewDto.userId, createReviewDto.productId);
    if (!order) throw new UnauthorizedException('해당 상품을 구매한 사용자만 리뷰를 작성할 수 있습니다.');

    const existingReview = await this.reviewRepository.findReviewByCondition(createReviewDto.userId, createReviewDto.productId);
    if (existingReview) throw new UnauthorizedException('이미 리뷰를 작성한 상품입니다.');

    return this.reviewRepository.create({ ...createReviewDto });
  }

  // Product에 해당하는 Review 목록 조회
  async findAllByProductId(userId: string, productId: string, query: { limit: number; page: number }) {
    const product = await this.reviewRepository.findProductById(productId);
    if (!product) throw new NotFoundException('요청한 리소스를 찾을 수 없습니다.');

    return this.reviewRepository.findAllByProductId(productId, query);
  }

  // Review 단건 조회
  async findReviewById(userId: string, reviewId: string) {
    const existingReview = await this.reviewRepository.findReviewById(reviewId);
    if (!existingReview) throw new NotFoundException('요청한 리소스를 찾을 수 없습니다.');
    if (existingReview.userId !== userId) throw new UnauthorizedException('인증이 필요합니다.');

    return existingReview;
  }

  // Review 수정
  async updateReview(userId: string, reviewId: string, updateReviewDto: UpdateReviewDto) {
    const existingReview = await this.reviewRepository.findReviewById(reviewId);
    if (!existingReview) throw new NotFoundException('요청한 리소스를 찾을 수 없습니다.');
    if (existingReview.userId !== userId) throw new UnauthorizedException('인증이 필요합니다.');

    return this.reviewRepository.updateReview(reviewId, updateReviewDto);
  }

  // Review 삭제
  async deleteReview(userId: string, reviewId: string) {
    const existingReview = await this.reviewRepository.findReviewById(reviewId);
    if (!existingReview) throw new NotFoundException('요청한 리소스를 찾을 수 없습니다.');
    if (existingReview.userId !== userId) throw new UnauthorizedException('인증이 필요합니다.');

    return this.reviewRepository.deleteReview(reviewId);
  }
}
