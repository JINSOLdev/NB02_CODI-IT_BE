import { Injectable } from '@nestjs/common';
import { AnswerStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class InquiryRepository {
  constructor(private prisma: PrismaService) { }

  // 내가 작성한 문의 목록 조회
  async getMyInquiries(
    userId: string,
    page: number,
    pageSize: number,
    status?: AnswerStatus,
  ) {
    // 트랜잭션으로 묶어서 리스트와 count 처리
    const result = await this.prisma.$transaction(async (tx) => {
      // 문의 리스트
      const list = await tx.inquiry.findMany({
        where: { userId, ...(status && { status }) },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          isSecret: true,
          status: true,
          createdAt: true,
          content: true,
          product: {
            select: {
              id: true,
              name: true,
              image: true,
              store: { select: { id: true, name: true } },
            },
          },
          user: { select: { nickname: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      // 문의 총 개수
      const totalCount = await tx.inquiry.count({
        where: { userId, ...(status && { status }) },
      });

      return { list, totalCount };
    });

    return result;
  }
}
