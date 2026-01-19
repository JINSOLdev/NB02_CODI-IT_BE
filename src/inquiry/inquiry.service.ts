import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AnswerStatus, UserType } from '@prisma/client';
import { InquiryRepository } from './inquiry.repository';
import {
  GetInquiriesDto,
  ReplyContentDto,
  UpdateInquiryDto,
} from './inquiry.dto';

@Injectable()
export class InquiryService {
  constructor(private inquiryRepository: InquiryRepository) {}

  // 내 문의 목록 조회 (BUYER - 본인이 작성 / SELLER - 본인 상품에 달린 문의)
  async getMyInquiries(
    userId: string,
    userType: UserType,
    query: GetInquiriesDto,
  ) {
    const { page = 1, pageSize = 16, status } = query;

    return await this.inquiryRepository.getMyInquiries(
      userId,
      userType,
      page,
      pageSize,
      status,
    );
  }

  // 문의 상세 조회
  async getInquiryDetail(inquiryId: string) {
    const inquiry = await this.inquiryRepository.getInquiryById(inquiryId);

    // 문의가 존재하지 않거나 접근이 거부된 경우
    if (!inquiry) throw new NotFoundException('문의가 존재하지 않습니다.');

    // user,product 필드 제거
    const formattedInquiry = {
      ...inquiry,
      user: undefined,
      product: undefined,
    };

    return formattedInquiry;
  }

  // 문의 수정
  async updateInquiry(
    userId: string,
    inquiryId: string,
    body: Partial<UpdateInquiryDto>,
  ) {
    const { title, content, isSecret } = body;
    const inquiry = await this.inquiryRepository.getInquiryById(inquiryId);
    const reply = inquiry?.reply;

    // 문의가 존재하지 않는 경우
    if (!inquiry) throw new NotFoundException('문의가 존재하지 않습니다.');

    // 내가 작성한 문의가 아닌 경우 접근 거부
    if (inquiry.userId !== userId)
      throw new UnauthorizedException(
        '자신이 작성한 문의만 수정할 수 있습니다.',
      );

    // 답변이 이미 달린 경우 수정 불가(문의 상태가 답변 완료인 경우 || 답변이 이미 존재하는 경우)
    if (inquiry.status === AnswerStatus.CompletedAnswer || reply)
      throw new ConflictException(
        '답변이 이미 달린 문의는 수정할 수 없습니다.',
      );

    return this.inquiryRepository.updateInquiry(
      inquiryId,
      title,
      content,
      isSecret,
    );
  }

  // 문의 삭제
  async deleteInquiry(userId: string, inquiryId: string) {
    const inquiry = await this.inquiryRepository.getInquiryById(inquiryId);

    // 문의가 존재하지 않는 경우
    if (!inquiry) throw new NotFoundException('문의가 존재하지 않습니다.');

    // 내가 작성한 문의가 아닌 경우 접근 거부
    if (inquiry.userId !== userId)
      throw new UnauthorizedException(
        '자신이 작성한 문의만 삭제할 수 있습니다.',
      );

    return this.inquiryRepository.deleteInquiry(inquiryId);
  }

  // 문의 답변 등록
  async createReply(userId: string, inquiryId: string, body: ReplyContentDto) {
    const inquiry = await this.inquiryRepository.getInquiryById(inquiryId);
    const { content } = body;

    // 문의가 존재하지 않는 경우
    if (!inquiry) throw new NotFoundException('문의가 존재하지 않습니다.');

    const reply = inquiry?.reply;
    const sellerId = inquiry?.product?.store?.sellerId;

    // 문의 상품의 판매자가 존재하지 않는 경우
    if (!sellerId)
      throw new NotFoundException('문의 상품의 판매자를 찾을 수 없습니다.');

    // 문의 상품의 판매자가 아닌 경우 접근 거부
    if (sellerId !== userId)
      throw new UnauthorizedException(
        '문의 상품의 판매자만 답변을 등록할 수 있습니다.',
      );

    // 이미 답변이 달린 경우 답변 불가(문의 상태가 답변 완료인 경우 || 답변이 이미 존재하는 경우)
    if (inquiry.status === AnswerStatus.CompletedAnswer || reply)
      throw new ConflictException(
        '이미 답변이 달린 문의는 답변을 등록할 수 없습니다.',
      );

    return this.inquiryRepository.createReply(userId, inquiryId, content);
  }

  async getReplyDetail(replyId: string) {
    const reply = await this.inquiryRepository.getReplyDetail(replyId);

    // 답변이 존재하지 않거나 접근이 거부된 경우
    if (!reply) throw new NotFoundException('답변이 존재하지 않습니다.');

    return reply;
  }

  // 문의 답변 수정
  async updateReply(userId: string, replyId: string, body: ReplyContentDto) {
    const { content } = body;
    const reply = await this.inquiryRepository.getReplyDetail(replyId);

    // 답변이 존재하지 않는 경우
    if (!reply) throw new NotFoundException('답변이 존재하지 않습니다.');

    // 답변의 작성자가 아닌 경우 접근 거부
    if (reply.userId !== userId)
      throw new UnauthorizedException(
        '자신이 작성한 답변만 수정할 수 있습니다.',
      );

    return this.inquiryRepository.updateReply(replyId, content);
  }

  // 문의 답변 삭제
  async deleteReply(userId: string, replyId: string) {
    const reply = await this.inquiryRepository.getReplyDetail(replyId);

    // 답변이 존재하지 않는 경우
    if (!reply) throw new NotFoundException('답변이 존재하지 않습니다.');
    // 답변의 작성자가 아닌 경우 접근 거부
    if (reply.userId !== userId)
      throw new UnauthorizedException(
        '자신이 작성한 답변만 삭제할 수 있습니다.',
      );

    return this.inquiryRepository.deleteReply(replyId);
  }
}
