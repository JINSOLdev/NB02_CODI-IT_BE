import { Injectable } from '@nestjs/common';
import { CreateReviewDto } from './review.dto';
import { ReviewRepository } from './review.repository';

@Injectable()
export class ReviewService {
  constructor(private reviewRepository: ReviewRepository) { }

  create(createReviewDto: CreateReviewDto & { userId: string; productId: string }) {
    return this.reviewRepository.create({ ...createReviewDto });
  }
}
