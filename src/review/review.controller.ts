import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CreateReviewDto, UpdateReviewDto } from './review.dto';
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
  @Get('/review/:reviewId')
  findReviewById(@Req() req: { user: AuthUser }, @Param('reviewId') reviewId: string) {
    const user = req.user;

    return this.reviewService.findReviewById(user.userId, reviewId);
  }

  // Review 수정
  @UseGuards(JwtAuthGuard)
  @Patch('/review/:reviewId')
  updateReview(@Req() req: { user: AuthUser }, @Param('reviewId') reviewId: string, @Body() updateReviewDto: UpdateReviewDto) {
    const user = req.user;

    return this.reviewService.updateReview(user.userId, reviewId, updateReviewDto);
  }

  // Review 삭제
  @UseGuards(JwtAuthGuard)
  @Delete('/review/:reviewId')
  deleteReview(@Req() req: { user: AuthUser }, @Param('reviewId') reviewId: string) {
    const user = req.user;

    return this.reviewService.deleteReview(user.userId, reviewId);
  }
}