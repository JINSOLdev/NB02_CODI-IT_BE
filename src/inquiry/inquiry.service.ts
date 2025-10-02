import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AnswerStatus } from '@prisma/client';
import { InquiryRepository } from './inquiry.repository';
import { GetInquiriesDto, UpdateInquiryDto } from './inquiry.dto';

@Injectable()
export class InquiryService {
  constructor(private inquiryRepository: InquiryRepository) { }

  // 내가 작성한 문의 목록 조회
  async getMyInquiries(userId: string, query: GetInquiriesDto) {
    const { page = 1, pageSize = 16, status } = query;
    const inquiries = await this.inquiryRepository.getMyInquiries(
      userId,
      page,
      pageSize,
      status,
    );
    const formatInquiries = ({ user, ...inquiry }) => ({
      ...inquiry,
      user: { name: user.nickname },
    });

    return {
      list: inquiries.list.map(formatInquiries),
      totalCount: inquiries.totalCount,
    };
  }

  // 문의 상세 조회
  async getInquiryDetail(inquiryId: string) {
    const inquiry = await this.inquiryRepository.getInquiryById(inquiryId);
    const reply = inquiry?.reply?.length ? inquiry.reply[0] : null;

    // 문의가 존재하지 않거나 접근이 거부된 경우
    if (!inquiry) throw new NotFoundException('문의가 존재하지 않습니다.');

    return {
      ...inquiry,
      user: { name: inquiry.user.nickname },
      // TODO : 추후 리팩토링 시 1:1 관계로 스키마 변경 예정
      reply: reply ? { ...reply, user: { name: reply.user.nickname }, } : null,
    };
  }

  async updateInquiry(userId: string, inquiryId: string, body: Partial<UpdateInquiryDto>) {
    const { title, content, isSecret } = body;
    const inquiry = await this.inquiryRepository.getInquiryById(inquiryId);
    const reply = inquiry?.reply?.length ? inquiry.reply[0] : null;

    // 문의가 존재하지 않는 경우
    if (!inquiry) throw new NotFoundException('문의가 존재하지 않습니다.');

    // 내가 작성한 문의가 아닌 경우 접근 거부
    if (inquiry.userId !== userId) throw new UnauthorizedException('자신이 작성한 문의만 수정할 수 있습니다.');

    // 답변이 이미 달린 경우 수정 불가(문의 상태가 답변 완료인 경우 || 답변이 이미 존재하는 경우)
    if (reply || inquiry.status === AnswerStatus.CompletedAnswer) throw new ConflictException('답변이 이미 달린 문의는 수정할 수 없습니다.');


    return this.inquiryRepository.updateInquiry(inquiryId, title, content, isSecret);
  }
}