import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CreateReviewDto } from './review.dto';
import { ReviewService } from './review.service';
import { AuthUser } from 'src/auth/auth.types';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

@Controller('/api')
export class ReviewController {
  constructor(private reviewService: ReviewService) { }

  // Review 등록
  @UseGuards(JwtAuthGuard)
  @Post('/product/:productId/reviews')
  create(@Req() req: { user: AuthUser }, @Param('productId') productId: string, @Body() createReviewDto: CreateReviewDto) {
    const user = req.user;

    return this.reviewService.create({ ...createReviewDto, userId: user.userId, productId });
  }

  // Product에 해당하는 Review 목록 조회
  @Get('/product/:productId/reviews')
  findAllByProductId(@Req() req: { user: AuthUser }, @Param('productId') productId: string, @Query('limit') limit: number, @Query('page') page: number) {
    const user = req.user;
    const query = { limit: limit || 5, page: page || 1 };

    return this.reviewService.findAllByProductId(user.userId, productId, query);
  }

  // Review 단건 조회
  @Get('/reviews/:reviewId')
  findReviewById(@Param('reviewId') reviewId: string) {
    return this.reviewService.findReviewById(reviewId);
  }

  // Review 수정
  @UseGuards(JwtAuthGuard)
  @Patch('/reviews/:reviewId')
  updateReview(@Req() req: { user: AuthUser }, @Param('reviewId') reviewId: string, @Body() body: { rating?: number; content?: string }) {
    const user = req.user;

    if (body.rating !== undefined && body.rating < 1) throw new Error('리뷰 평점은 최소 1점 이상이어야 합니다.');
    if (body.rating !== undefined && body.rating > 5) throw new Error('리뷰 평점은 최대 5점 이하이어야 합니다.');
    if (body.content !== undefined && body.content.length < 10) throw new Error('리뷰 내용은 최소 10자 이상이어야 합니다.');

    return this.reviewService.updateReview(user.userId, reviewId, body.rating, body.content);
  }

  // Review 삭제
  @Delete('/reviews/:reviewId')
  deleteReview(@Req() req: { user: AuthUser }, @Param('reviewId') reviewId: string) {
    const user = req.user;
    return this.reviewService.deleteReview(user.userId, reviewId);
  }
}