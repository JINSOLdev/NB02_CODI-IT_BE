import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateReviewDto, UpdateReviewDto } from './review.dto';
import { ReviewService } from './review.service';
import { AuthUser } from 'src/auth/auth.types';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { ParseCuidPipe } from 'src/common/pipes/parse-cuid.pipe';

@Controller('/api')
export class ReviewController {
  constructor(private reviewService: ReviewService) { }

  // Review 등록
  @UseGuards(JwtAuthGuard)
  @Post('/product/:productId/reviews')
  createReview(
    @Req() req: { user: AuthUser },
    @Param('productId', ParseCuidPipe) productId: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    const userId = req.user.userId;

    return this.reviewService.createReview({
      ...createReviewDto,
      userId,
      productId,
    });
  }

  // Product에 해당하는 Review 목록 조회
  @Get('/product/:productId/reviews')
  findAllByProductId(
    @Param('productId', ParseCuidPipe) productId: string,
    @Query('limit') limit: string,
    @Query('page') page: string,
  ) {
    const query = { limit: parseInt(limit, 10) || 5, page: parseInt(page, 10) || 1 };

    return this.reviewService.findAllByProductId(productId, query);
  }

  // Review 단건 조회
  @Get('/review/:reviewId')
  findReviewById(
    @Req() req: { user: AuthUser },
    @Param('reviewId', ParseCuidPipe) reviewId: string,
  ) {
    const userId = req.user.userId;

    return this.reviewService.findReviewById(userId, reviewId);
  }

  // Review 수정
  @UseGuards(JwtAuthGuard)
  @Patch('/review/:reviewId')
  updateReview(
    @Req() req: { user: AuthUser },
    @Param('reviewId', ParseCuidPipe) reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    const userId = req.user.userId;

    return this.reviewService.updateReview(userId, reviewId, updateReviewDto);
  }

  // Review 삭제
  @UseGuards(JwtAuthGuard)
  @Delete('/review/:reviewId')
  deleteReview(@Req() req: { user: AuthUser }, @Param('reviewId', ParseCuidPipe) reviewId: string) {
    const userId = req.user.userId;

    return this.reviewService.deleteReview(userId, reviewId);
  }
}
