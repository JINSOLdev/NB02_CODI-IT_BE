import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReviewDto } from './review.dto';

@Injectable()
export class ReviewRepository {
  constructor(private prisma: PrismaService) { }

  // Review 등록
  create(createReviewDto: CreateReviewDto & { userId: string; productId: string }) {
    return this.prisma.review.create({
      data: { ...createReviewDto },
      select: { id: true, rating: true, content: true, userId: true, productId: true, createdAt: true },
    });
  }

  // Review 등록 시, Product 존재 여부 확인
  findProductById(productId: string) {
    return this.prisma.product.findUnique({ where: { id: productId } });
  }

  // Product에 해당하는 Review 목록 조회
  findAllByProductId(productId: string, query: { limit: number; page: number }) {
    return this.prisma.review.findMany({
      where: { productId },
      select: { id: true, rating: true, content: true, userId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: query.limit || 5,
      skip: (query.page - 1) * (query.limit || 5),
    });
  }

  // Review 단건 조회
  findReviewById(reviewId: string) {
    return this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, rating: true, content: true, userId: true, createdAt: true },
    });
  }

  // Review 수정
  updateReview(reviewId: string, rating?: number, content?: string) {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { rating, content },
      select: { id: true, rating: true, content: true, userId: true, productId: true, createdAt: true },
    });
  }

  // Review 삭제
  deleteReview(reviewId: string) {
    return this.prisma.review.delete({
      where: { id: reviewId },
      select: { id: true, content: true, },
    });
  }
}
