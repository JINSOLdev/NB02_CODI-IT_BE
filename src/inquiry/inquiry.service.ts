import { Injectable, NotFoundException } from '@nestjs/common';
import { InquiryRepository } from './inquiry.repository';
import { GetInquiriesDto } from './inquiry.dto';

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
}