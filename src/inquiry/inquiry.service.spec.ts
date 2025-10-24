import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AnswerStatus } from '@prisma/client';
import { InquiryService } from './inquiry.service';
import { InquiryRepository } from './inquiry.repository';
import {
  GetInquiriesDto,
  ReplyContentDto,
  UpdateInquiryDto,
} from './inquiry.dto';

describe('InquiryService', () => {
  let service: InquiryService;
  let repository: InquiryRepository;

  const mockInquiryRepository = {
    getMyInquiries: jest.fn(),
    getInquiryById: jest.fn(),
    updateInquiry: jest.fn(),
    deleteInquiry: jest.fn(),
    createReply: jest.fn(),
    getReplyDetail: jest.fn(),
    updateReply: jest.fn(),
    deleteReply: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InquiryService,
        {
          provide: InquiryRepository,
          useValue: mockInquiryRepository,
        },
      ],
    }).compile();

    service = module.get<InquiryService>(InquiryService);
    repository = module.get<InquiryRepository>(InquiryRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyInquiries', () => {
    const userId = 'test-user-id';
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

    it('문의 목록 조회', async () => {
      const query: GetInquiriesDto = { page: 1, pageSize: 16 };
      mockInquiryRepository.getMyInquiries.mockResolvedValue(mockResult);

      const result = await service.getMyInquiries(userId, query);

      expect(repository.getMyInquiries).toHaveBeenCalledWith(
        userId,
        1,
        16,
        undefined,
      );
      expect(result).toEqual(mockResult);
    });

    it('페이지 정보에 따른 문의 목록 조회', async () => {
      const query: GetInquiriesDto = { page: 2, pageSize: 10 };
      mockInquiryRepository.getMyInquiries.mockResolvedValue(mockResult);

      const result = await service.getMyInquiries(userId, query);

      expect(repository.getMyInquiries).toHaveBeenCalledWith(
        userId,
        2,
        10,
        undefined,
      );
      expect(result).toEqual(mockResult);
    });

    it('조건에 따른 문의 목록 조회', async () => {
      const query: GetInquiriesDto = {
        page: 1,
        pageSize: 16,
        status: AnswerStatus.CompletedAnswer,
      };
      mockInquiryRepository.getMyInquiries.mockResolvedValue(mockResult);

      const result = await service.getMyInquiries(userId, query);

      expect(repository.getMyInquiries).toHaveBeenCalledWith(
        userId,
        1,
        16,
        AnswerStatus.CompletedAnswer,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getInquiryDetail', () => {
    const inquiryId = 'inquiry-id';
    const mockInquiry = {
      id: inquiryId,
      userId: 'user-id',
      title: '문의 제목',
      content: '문의 내용',
      status: AnswerStatus.WaitingAnswer,
      user: { name: '사용자명' },
      reply: {
        id: 'reply-id',
        content: '답변 내용',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { name: '판매자명' },
      },
    };

    it('문의 상세 정보 조회', async () => {
      mockInquiryRepository.getInquiryById.mockResolvedValue(mockInquiry);

      const result = await service.getInquiryDetail(inquiryId);

      expect(repository.getInquiryById).toHaveBeenCalledWith(inquiryId);
      expect(result).toEqual({
        ...mockInquiry,
        user: { ...mockInquiry.user },
        reply: { ...mockInquiry.reply },
      });
    });

    it('답변이 없는 문의의 상세 정보 조회', async () => {
      const mockInquiryWithoutReply = { ...mockInquiry, reply: null };
      mockInquiryRepository.getInquiryById.mockResolvedValue(
        mockInquiryWithoutReply,
      );

      const result = await service.getInquiryDetail(inquiryId);

      expect(result.reply).toBeNull();
    });
  });

  describe('updateInquiry', () => {
    const userId = 'user-id';
    const inquiryId = 'inquiry-id';
    const updateData: Partial<UpdateInquiryDto> = {
      title: '수정된 제목',
      content: '수정된 내용',
    };
    const mockInquiry = {
      id: inquiryId,
      userId,
      status: AnswerStatus.WaitingAnswer,
      reply: null,
    };

    it('문의 수정', async () => {
      mockInquiryRepository.getInquiryById.mockResolvedValue(mockInquiry);
      mockInquiryRepository.updateInquiry.mockResolvedValue({ id: inquiryId });

      const result = await service.updateInquiry(userId, inquiryId, updateData);

      expect(repository.getInquiryById).toHaveBeenCalledWith(inquiryId);
      expect(repository.updateInquiry).toHaveBeenCalledWith(
        inquiryId,
        updateData.title,
        updateData.content,
        updateData.isSecret,
      );
      expect(result).toEqual({ id: inquiryId });
    });

    it('문의가 존재하지 않을 때', async () => {
      mockInquiryRepository.getInquiryById.mockResolvedValue(null);

      await expect(
        service.updateInquiry(userId, inquiryId, updateData),
      ).rejects.toThrow(new NotFoundException('문의가 존재하지 않습니다.'));
    });

    it('다른 사용자의 문의 수정', async () => {
      const otherUserInquiry = { ...mockInquiry, userId: 'other-user-id' };
      mockInquiryRepository.getInquiryById.mockResolvedValue(otherUserInquiry);

      await expect(
        service.updateInquiry(userId, inquiryId, updateData),
      ).rejects.toThrow(
        new UnauthorizedException('자신이 작성한 문의만 수정할 수 있습니다.'),
      );
    });

    it('답변 완료된 문의 수정', async () => {
      const completedInquiry = {
        ...mockInquiry,
        status: AnswerStatus.CompletedAnswer,
      };
      mockInquiryRepository.getInquiryById.mockResolvedValue(completedInquiry);

      await expect(
        service.updateInquiry(userId, inquiryId, updateData),
      ).rejects.toThrow(
        new ConflictException('답변이 이미 달린 문의는 수정할 수 없습니다.'),
      );
    });

    it('답변이 존재하는 문의 수정', async () => {
      const inquiryWithReply = { ...mockInquiry, reply: { id: 'reply-id' } };
      mockInquiryRepository.getInquiryById.mockResolvedValue(inquiryWithReply);

      await expect(
        service.updateInquiry(userId, inquiryId, updateData),
      ).rejects.toThrow(
        new ConflictException('답변이 이미 달린 문의는 수정할 수 없습니다.'),
      );
    });
  });

  describe('deleteInquiry', () => {
    const userId = 'user-id';
    const inquiryId = 'inquiry-id';
    const mockInquiry = {
      id: inquiryId,
      userId,
    };

    it('문의 삭제', async () => {
      mockInquiryRepository.getInquiryById.mockResolvedValue(mockInquiry);
      mockInquiryRepository.deleteInquiry.mockResolvedValue({ id: inquiryId });

      const result = await service.deleteInquiry(userId, inquiryId);

      expect(repository.getInquiryById).toHaveBeenCalledWith(inquiryId);
      expect(repository.deleteInquiry).toHaveBeenCalledWith(inquiryId);
      expect(result).toEqual({ id: inquiryId });
    });

    it('다른 사용자의 문의 삭제', async () => {
      const otherUserInquiry = { ...mockInquiry, userId: 'other-user-id' };
      mockInquiryRepository.getInquiryById.mockResolvedValue(otherUserInquiry);

      await expect(service.deleteInquiry(userId, inquiryId)).rejects.toThrow(
        new UnauthorizedException('자신이 작성한 문의만 삭제할 수 있습니다.'),
      );
    });
  });

  describe('createReply', () => {
    const sellerId = 'seller-id';
    const inquiryId = 'inquiry-id';
    const replyContent: ReplyContentDto = { content: '답변 내용' };
    const mockInquiry = {
      id: inquiryId,
      status: AnswerStatus.WaitingAnswer,
      reply: null,
      product: {
        store: {
          sellerId,
        },
      },
    };

    it('답변 등록', async () => {
      mockInquiryRepository.getInquiryById.mockResolvedValue(mockInquiry);
      mockInquiryRepository.createReply.mockResolvedValue({ id: 'reply-id' });

      const result = await service.createReply(
        sellerId,
        inquiryId,
        replyContent,
      );

      expect(repository.getInquiryById).toHaveBeenCalledWith(inquiryId);
      expect(repository.createReply).toHaveBeenCalledWith(
        sellerId,
        inquiryId,
        replyContent.content,
      );
      expect(result).toEqual({ id: 'reply-id' });
    });

    it('문의가 존재하지 않을 때', async () => {
      mockInquiryRepository.getInquiryById.mockResolvedValue(null);

      await expect(
        service.createReply(sellerId, inquiryId, replyContent),
      ).rejects.toThrow(new NotFoundException('문의가 존재하지 않습니다.'));
    });

    it('문의 상품의 판매자가 없는 경우', async () => {
      const inquiryWithoutSeller = {
        ...mockInquiry,
        product: { store: { sellerId: null } },
      };
      mockInquiryRepository.getInquiryById.mockResolvedValue(
        inquiryWithoutSeller,
      );

      await expect(
        service.createReply(sellerId, inquiryId, replyContent),
      ).rejects.toThrow(
        new NotFoundException('문의 상품의 판매자를 찾을 수 없습니다.'),
      );
    });

    it('상품의 판매자가 아닌 경우 ', async () => {
      mockInquiryRepository.getInquiryById.mockResolvedValue(mockInquiry);

      await expect(
        service.createReply('other-user-id', inquiryId, replyContent),
      ).rejects.toThrow(
        new UnauthorizedException(
          '문의 상품의 판매자만 답변을 등록할 수 있습니다.',
        ),
      );
    });

    it('답변 완료된 문의에 답변을 등록 할 때', async () => {
      const completedInquiry = {
        ...mockInquiry,
        status: AnswerStatus.CompletedAnswer,
      };
      mockInquiryRepository.getInquiryById.mockResolvedValue(completedInquiry);

      await expect(
        service.createReply(sellerId, inquiryId, replyContent),
      ).rejects.toThrow(
        new ConflictException(
          '이미 답변이 달린 문의는 답변을 등록할 수 없습니다.',
        ),
      );
    });

    it('이미 답변이 존재하는 문의에 답변을 등록 할 때', async () => {
      const inquiryWithReply = {
        ...mockInquiry,
        reply: { id: 'existing-reply' },
      };
      mockInquiryRepository.getInquiryById.mockResolvedValue(inquiryWithReply);

      await expect(
        service.createReply(sellerId, inquiryId, replyContent),
      ).rejects.toThrow(
        new ConflictException(
          '이미 답변이 달린 문의는 답변을 등록할 수 없습니다.',
        ),
      );
    });
  });

  describe('getReplyDetail', () => {
    const replyId = 'reply-id';
    const mockReply = {
      id: replyId,
      content: '답변 내용',
      userId: 'seller-id',
    };

    it('답변 상세 정보 조회', async () => {
      mockInquiryRepository.getReplyDetail.mockResolvedValue(mockReply);

      const result = await service.getReplyDetail(replyId);

      expect(repository.getReplyDetail).toHaveBeenCalledWith(replyId);
      expect(result).toEqual(mockReply);
    });

    it('존재하지 않는 답변 조회', async () => {
      mockInquiryRepository.getReplyDetail.mockResolvedValue(null);

      await expect(service.getReplyDetail(replyId)).rejects.toThrow(
        new NotFoundException('답변이 존재하지 않습니다.'),
      );
    });
  });

  describe('updateReply', () => {
    const userId = 'seller-id';
    const replyId = 'reply-id';
    const replyContent: ReplyContentDto = { content: '수정된 답변 내용' };
    const mockReply = {
      id: replyId,
      userId,
      content: '기존 답변 내용',
    };

    it('답변 수정', async () => {
      mockInquiryRepository.getReplyDetail.mockResolvedValue(mockReply);
      mockInquiryRepository.updateReply.mockResolvedValue({
        ...mockReply,
        content: replyContent.content,
      });

      const result = await service.updateReply(userId, replyId, replyContent);

      expect(repository.getReplyDetail).toHaveBeenCalledWith(replyId);
      expect(repository.updateReply).toHaveBeenCalledWith(
        replyId,
        replyContent.content,
      );
      expect(result).toEqual({ ...mockReply, content: replyContent.content });
    });

    it('존재하지 않는 답변 수정', async () => {
      mockInquiryRepository.getReplyDetail.mockResolvedValue(null);

      await expect(
        service.updateReply(userId, replyId, replyContent),
      ).rejects.toThrow(new NotFoundException('답변이 존재하지 않습니다.'));
    });

    it('다른 사용자의 답변 수정', async () => {
      const otherUserReply = { ...mockReply, userId: 'other-user-id' };
      mockInquiryRepository.getReplyDetail.mockResolvedValue(otherUserReply);

      await expect(
        service.updateReply(userId, replyId, replyContent),
      ).rejects.toThrow(
        new UnauthorizedException('자신이 작성한 답변만 수정할 수 있습니다.'),
      );
    });
  });

  describe('deleteReply', () => {
    const userId = 'seller-id';
    const replyId = 'reply-id';
    const mockReply = {
      id: replyId,
      userId,
    };

    it('답변 삭제', async () => {
      mockInquiryRepository.getReplyDetail.mockResolvedValue(mockReply);
      mockInquiryRepository.deleteReply.mockResolvedValue(mockReply);

      const result = await service.deleteReply(userId, replyId);

      expect(repository.getReplyDetail).toHaveBeenCalledWith(replyId);
      expect(repository.deleteReply).toHaveBeenCalledWith(replyId);
      expect(result).toEqual(mockReply);
    });

    it('존재하지 않는 답변 삭제', async () => {
      mockInquiryRepository.getReplyDetail.mockResolvedValue(null);

      await expect(service.deleteReply(userId, replyId)).rejects.toThrow(
        new NotFoundException('답변이 존재하지 않습니다.'),
      );
    });

    it('다른 사용자의 답변 삭제', async () => {
      const otherUserReply = { ...mockReply, userId: 'other-user-id' };
      mockInquiryRepository.getReplyDetail.mockResolvedValue(otherUserReply);

      await expect(service.deleteReply(userId, replyId)).rejects.toThrow(
        new UnauthorizedException('자신이 작성한 답변만 삭제할 수 있습니다.'),
      );
    });
  });
});
