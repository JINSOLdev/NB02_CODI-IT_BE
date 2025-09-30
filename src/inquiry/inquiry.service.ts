import { Injectable } from '@nestjs/common';
import { InquiryRepository } from './inquiry.repository';
import { GetInquiriesDto } from './inquiry.dto';

@Injectable()
export class InquiryService {
  constructor(private inquiryRepository: InquiryRepository) { }

  // 내가 작성한 문의 목록 조회
  async getMyInquiries(userId: string, query: GetInquiriesDto) {
    const inquiries = await this.inquiryRepository.getMyInquiries(userId, query);
    const formatInquiries = ({ user, ...inquiry }) => ({
      ...inquiry,
      user: { name: user.nickname },
    });

    return {
      list: inquiries.list.map(formatInquiries),
      totalCount: inquiries.totalCount,
    };
  }
}