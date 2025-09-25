import { Injectable } from '@nestjs/common';
import { CreateReviewDto } from './review.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReviewRepository {
  constructor(private prisma: PrismaService) { }

  findReviewById(reviewId: string) {
    return this.prisma.review.findUnique({
      where: { id: reviewId }
    });
  }

  create(createReviewDto: CreateReviewDto & { userId: string; productId: string }) {
    return this.prisma.review.create({
      data: { ...createReviewDto },
      select: { id: true, rating: true, content: true, userId: true, productId: true, createdAt: true },
    });
  }

  updateReview(reviewId: string, rating?: number, content?: string) {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { rating, content },
      select: { id: true, rating: true, content: true, userId: true, productId: true, createdAt: true },
    });
  }
}
