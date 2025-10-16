import { Injectable } from '@nestjs/common';
import { AnswerStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class InquiryRepository {
  constructor(private prisma: PrismaService) { }

  // 내가 작성한 문의 목록 조회
  async getMyInquiries(userId: string, page: number, pageSize: number, status?: AnswerStatus) {
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
          user: { select: { name: true } },
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

  // 문의 상세 조회
  async getInquiryById(inquiryId: string) {
    return this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
      select: {
        id: true,
        userId: true,
        productId: true,
        title: true,
        content: true,
        status: true,
        isSecret: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { name: true } },
        reply: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            user: { select: { name: true } },
          },
        },
        product: { select: { store: { select: { sellerId: true } } } },
      },
    });
  }

  // 문의 수정
  async updateInquiry(inquiryId: string, title?: string, content?: string, isSecret?: boolean) {
    return this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: { title, content, isSecret },
    });
  }

  // 문의 삭제
  async deleteInquiry(inquiryId: string) {
    return this.prisma.inquiry.delete({
      where: { id: inquiryId },
    });
  }

  // 문의 답변 등록
  async createReply(userId: string, inquiryId: string, content: string) {
    return this.prisma.$transaction(async (tx) => {
      // 답변 생성
      const answer = await tx.answer.create({
        data: {
          content,
          inquiryId,
          userId,
        },
        select: {
          id: true,
          inquiryId: true,
          userId: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { id: true, name: true } },
        },
      });

      // 문의 상태를 '답변 완료'로 변경
      await tx.inquiry.update({
        where: { id: inquiryId },
        data: { status: AnswerStatus.CompletedAnswer },
      });

      return answer;
    });
  }

  async getReplyDetail(replyId: string) {
    return this.prisma.answer.findFirst({
      where: { id: replyId },
      select: {
        id: true,
        inquiryId: true,
        userId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true } },
      },
    });
  }

  async updateReply(replyId: string, content: string) {
    return this.prisma.answer.update({
      where: { id: replyId },
      data: { content },
      select: {
        id: true,
        inquiryId: true,
        userId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true } },
      },
    });
  }

  async deleteReply(replyId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 답변 삭제
      const deletedAnswer = await tx.answer.delete({
        where: { id: replyId },
        select: {
          id: true,
          inquiryId: true,
          userId: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { id: true, name: true } },
        },
      });

      // 문의 상태를 '답변 대기'로 변경
      await tx.inquiry.update({
        where: { id: deletedAnswer.inquiryId },
        data: { status: AnswerStatus.WaitingAnswer },
      });

      return deletedAnswer;
    });
  }
}
