import { Test, TestingModule } from '@nestjs/testing';
import { AnswerStatus, UserType } from '@prisma/client';
import { InquiryController } from './inquiry.controller';
import { InquiryService } from './inquiry.service';
import {
  GetInquiriesDto,
  UpdateInquiryDto,
  ReplyContentDto,
} from './inquiry.dto';
import { AuthUser } from 'src/auth/auth.types';

describe('InquiryController', () => {
  let controller: InquiryController;
  let service: InquiryService;

  const mockInquiryService = {
    getMyInquiries: jest.fn(),
    getInquiryDetail: jest.fn(),
    updateInquiry: jest.fn(),
    deleteInquiry: jest.fn(),
    createReply: jest.fn(),
    getReplyDetail: jest.fn(),
    updateReply: jest.fn(),
    deleteReply: jest.fn(),
  };

  const mockUser: AuthUser = {
    userId: 'test-user-id',
    email: 'test@example.com',
    type: UserType.BUYER,
    points: 100,
    grade: {
      id: 'grade-1',
      name: 'Silver',
      rate: 1.0,
      minAmount: 0,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InquiryController],
      providers: [
        {
          provide: InquiryService,
          useValue: mockInquiryService,
        },
      ],
    }).compile();

    controller = module.get<InquiryController>(InquiryController);
    service = module.get<InquiryService>(InquiryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyInquiries', () => {
    const mockResult = {
      list: [
        {
          id: 'inquiry-1',
          title: '문의 제목',
          isSecret: false,
          status: AnswerStatus.WaitingAnswer,
          createdAt: new Date(),
          content: '문의 내용',
          product: {
            id: 'product-1',
            name: '상품명',
            image: 'image-url',
            store: { id: 'store-1', name: '스토어명' },
          },
          user: { name: '사용자명' },
        },
      ],
      totalCount: 1,
    };

    it('내가 작성한 문의 목록 조회', async () => {
      const query: GetInquiriesDto = { page: 1, pageSize: 16 };
      const req = { user: mockUser };
      mockInquiryService.getMyInquiries.mockResolvedValue(mockResult);

      const result = await controller.getMyInquiries(req, query);

      expect(service.getMyInquiries).toHaveBeenCalledWith(
        mockUser.userId,
        query,
      );
      expect(result).toEqual(mockResult);
    });

    it('페이지네이션과 상태 필터로 문의 목록 조회', async () => {
      const query: GetInquiriesDto = {
        page: 2,
        pageSize: 10,
        status: AnswerStatus.CompletedAnswer,
      };
      const req = { user: mockUser };
      mockInquiryService.getMyInquiries.mockResolvedValue(mockResult);

      const result = await controller.getMyInquiries(req, query);

      expect(service.getMyInquiries).toHaveBeenCalledWith(
        mockUser.userId,
        query,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getInquiryDetail', () => {
    const inquiryId = 'inquiry-id';
    const mockInquiry = {
      id: inquiryId,
      title: '문의 제목',
      content: '문의 내용',
      user: { name: '사용자명' },
      reply: null,
    };

    it('문의 상세 정보 조회', async () => {
      mockInquiryService.getInquiryDetail.mockResolvedValue(mockInquiry);

      const result = await controller.getInquiryDetail(inquiryId);

      expect(service.getInquiryDetail).toHaveBeenCalledWith(inquiryId);
      expect(result).toEqual(mockInquiry);
    });
  });

  describe('updateInquiry', () => {
    const inquiryId = 'inquiry-id';
    const req = { user: mockUser };
    const mockUpdatedInquiry = { id: inquiryId, title: '수정된 제목' };

    it('문의 수정', async () => {
      const body: UpdateInquiryDto = {
        title: '수정된 제목',
        content: '수정된 내용',
      };
      mockInquiryService.updateInquiry.mockResolvedValue(mockUpdatedInquiry);

      const result = await controller.updateInquiry(req, inquiryId, body);

      expect(service.updateInquiry).toHaveBeenCalledWith(
        mockUser.userId,
        inquiryId,
        { title: body.title, content: body.content },
      );
      expect(result).toEqual(mockUpdatedInquiry);
    });

    it('문의 제목만 수정', async () => {
      const body: UpdateInquiryDto = { title: '수정된 제목' };
      mockInquiryService.updateInquiry.mockResolvedValue(mockUpdatedInquiry);

      const result = await controller.updateInquiry(req, inquiryId, body);

      expect(service.updateInquiry).toHaveBeenCalledWith(
        mockUser.userId,
        inquiryId,
        { title: body.title },
      );
      expect(result).toEqual(mockUpdatedInquiry);
    });

    it('문의 내용만 수정', async () => {
      const body: UpdateInquiryDto = { content: '수정된 내용' };
      mockInquiryService.updateInquiry.mockResolvedValue(mockUpdatedInquiry);

      const result = await controller.updateInquiry(req, inquiryId, body);

      expect(service.updateInquiry).toHaveBeenCalledWith(
        mockUser.userId,
        inquiryId,
        { content: body.content },
      );
      expect(result).toEqual(mockUpdatedInquiry);
    });

    it('문의 비밀글 여부만 수정', async () => {
      const body: UpdateInquiryDto = { isSecret: true };
      mockInquiryService.updateInquiry.mockResolvedValue(mockUpdatedInquiry);

      const result = await controller.updateInquiry(req, inquiryId, body);

      expect(service.updateInquiry).toHaveBeenCalledWith(
        mockUser.userId,
        inquiryId,
        { isSecret: body.isSecret },
      );
      expect(result).toEqual(mockUpdatedInquiry);
    });
  });

  describe('deleteInquiry', () => {
    const inquiryId = 'inquiry-id';
    const req = { user: mockUser };
    const mockDeleteResult = { id: inquiryId };

    it('문의 삭제', async () => {
      mockInquiryService.deleteInquiry.mockResolvedValue(mockDeleteResult);

      const result = await controller.deleteInquiry(req, inquiryId);

      expect(service.deleteInquiry).toHaveBeenCalledWith(
        mockUser.userId,
        inquiryId,
      );
      expect(result).toEqual(mockDeleteResult);
    });
  });

  describe('createReply', () => {
    const inquiryId = 'inquiry-id';
    const req = { user: mockUser };
    const mockReply = { id: 'reply-id', content: '답변 내용' };

    it('답변 등록', async () => {
      const body: ReplyContentDto = { content: '답변 내용' };
      mockInquiryService.createReply.mockResolvedValue(mockReply);

      const result = await controller.createReply(req, inquiryId, body);

      expect(service.createReply).toHaveBeenCalledWith(
        mockUser.userId,
        inquiryId,
        body,
      );
      expect(result).toEqual(mockReply);
    });
  });

  describe('getReplyDetail', () => {
    const replyId = 'reply-id';
    const mockReply = {
      id: replyId,
      content: '답변 내용',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { name: '판매자명' },
    };

    it('답변 상세 정보 조회', async () => {
      mockInquiryService.getReplyDetail.mockResolvedValue(mockReply);

      const result = await controller.getReplyDetail(replyId);

      expect(service.getReplyDetail).toHaveBeenCalledWith(replyId);
      expect(result).toEqual(mockReply);
    });
  });

  describe('updateReply', () => {
    const replyId = 'reply-id';
    const req = { user: mockUser };
    const mockUpdatedReply = { id: replyId, content: '수정된 답변 내용' };

    it('답변 수정', async () => {
      const body: ReplyContentDto = { content: '수정된 답변 내용' };
      mockInquiryService.updateReply.mockResolvedValue(mockUpdatedReply);

      const result = await controller.updateReply(req, replyId, body);

      expect(service.updateReply).toHaveBeenCalledWith(
        mockUser.userId,
        replyId,
        body,
      );
      expect(result).toEqual(mockUpdatedReply);
    });
  });

  describe('deleteReply', () => {
    const replyId = 'reply-id';
    const req = { user: mockUser };
    const mockDeleteResult = { id: replyId };

    it('답변 삭제', async () => {
      mockInquiryService.deleteReply.mockResolvedValue(mockDeleteResult);

      const result = await controller.deleteReply(req, replyId);

      expect(service.deleteReply).toHaveBeenCalledWith(
        mockUser.userId,
        replyId,
      );
      expect(result).toEqual(mockDeleteResult);
    });
  });
});
