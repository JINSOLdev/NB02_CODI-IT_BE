import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CreateReviewDto } from './review.dto';
import { ReviewService } from './review.service';
import { AuthUser } from 'src/auth/auth.types';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

@Controller('/api')
export class ReviewController {
  constructor(private reviewService: ReviewService) { }

  @UseGuards(JwtAuthGuard)
  @Post('/product/:productId/reviews')
  create(@Req() req: { user: AuthUser }, @Param('productId') productId: string, @Body() createReviewDto: CreateReviewDto) {
    const user = req.user!;

    return this.reviewService.create({ ...createReviewDto, userId: user.userId, productId });
  }
}