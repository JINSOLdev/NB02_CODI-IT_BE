import { Body, Controller, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { CreateReviewDto } from './review.dto';
import { ReviewService } from './review.service';
import { AuthUser } from 'src/auth/auth.types';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

@Controller('/api')
@UseGuards(JwtAuthGuard)
export class ReviewController {
  constructor(private reviewService: ReviewService) { }

  @Post('/product/:productId/reviews')
  create(@Req() req: { user: AuthUser }, @Param('productId') productId: string, @Body() createReviewDto: CreateReviewDto) {
    const user = req.user!;

    return this.reviewService.create({ ...createReviewDto, userId: user.userId, productId });
  }

  @Patch('/reviews/:reviewId')
  updateReview(@Req() req: { user: AuthUser }, @Param('reviewId') reviewId: string, @Body() body: { rating?: number; content?: string }) {
    const user = req.user;

    if (body.rating !== undefined && body.rating < 1) throw new Error('리뷰 평점은 최소 1점 이상이어야 합니다.');
    if (body.rating !== undefined && body.rating > 5) throw new Error('리뷰 평점은 최대 5점 이하이어야 합니다.');
    if (body.content !== undefined && body.content.length < 10) throw new Error('리뷰 내용은 최소 10자 이상이어야 합니다.');

    return this.reviewService.updateReview(user.userId, reviewId, body.rating, body.content);
  }
}