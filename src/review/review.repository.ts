import { Injectable } from '@nestjs/common';
import { CreateReviewDto } from './review.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReviewRepository {
  constructor(private prisma: PrismaService) { }

  create(createReviewDto: CreateReviewDto & { userId: string; productId: string }) {
    return this.prisma.review.create({
      data: { ...createReviewDto },
      select: { id: true, rating: true, content: true, userId: true, productId: true, createdAt: true },
    });

  }
}
