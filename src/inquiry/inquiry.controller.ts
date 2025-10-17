import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { AuthUser } from 'src/auth/auth.types';
import { InquiryService } from './inquiry.service';
import { GetInquiriesDto, UpdateInquiryDto, ReplyContentDto } from './inquiry.dto';
import { ParseCuidPipe } from 'src/common/pipes/parse-cuid.pipe';

@Controller('api/inquiries')
export class InquiryController {
  constructor(private inquiryService: InquiryService) { }

  // 내가 작성한 문의 목록 조회
  @UseGuards(JwtAuthGuard)
  @Get()
  getMyInquiries(@Req() req: { user: AuthUser }, @Query() query: GetInquiriesDto) {
    const userId = req.user.userId;

    return this.inquiryService.getMyInquiries(userId, query);
  }

  // 문의 상세 조회
  @UseGuards(JwtAuthGuard)
  @Get(':inquiryId')
  getInquiryDetail(@Param('inquiryId') inquiryId: string) {
    return this.inquiryService.getInquiryDetail(inquiryId);
  }

  // 문의 수정
  @UseGuards(JwtAuthGuard)
  @Patch(':inquiryId')
  updateInquiry(
    @Req() req: { user: AuthUser },
    @Param('inquiryId', ParseCuidPipe) inquiryId: string,
    @Body() body: UpdateInquiryDto,
  ) {
    const userId = req.user.userId;
    const { title, content, isSecret } = body;

    // 수정 요청 시 최소 1개의 필드가 입력되어야 함
    if (title === undefined && content === undefined && isSecret === undefined)
      throw new BadRequestException('수정할 필드를 최소 1개 이상 입력해주세요.');

    // undefined 값만 필터링
    const updateData: Partial<UpdateInquiryDto> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (isSecret !== undefined) updateData.isSecret = isSecret;

    return this.inquiryService.updateInquiry(userId, inquiryId, updateData);
  }

  // 문의 삭제
  @UseGuards(JwtAuthGuard)
  @Delete(':inquiryId')
  deleteInquiry(
    @Req() req: { user: AuthUser },
    @Param('inquiryId', ParseCuidPipe) inquiryId: string,
  ) {
    const userId = req.user.userId;

    return this.inquiryService.deleteInquiry(userId, inquiryId);
  }

  // 문의 답변 등록
  @UseGuards(JwtAuthGuard)
  @Post(':inquiryId/replies')
  createReply(
    @Req() req: { user: AuthUser },
    @Param('inquiryId', ParseCuidPipe) inquiryId: string,
    @Body() body: ReplyContentDto,
  ) {
    const userId = req.user.userId;

    if (body.content === undefined) throw new BadRequestException('내용을 입력해주세요.');

    return this.inquiryService.createReply(userId, inquiryId, body);
  }

  // 문의 답변 상세 조회
  @Get(':replyId/replies')
  getReplyDetail(@Param('replyId', ParseCuidPipe) replyId: string) {
    return this.inquiryService.getReplyDetail(replyId);
  }

  // 문의 답변 수정
  @UseGuards(JwtAuthGuard)
  @Patch(':replyId/replies')
  updateReply(
    @Req() req: { user: AuthUser },
    @Param('replyId', ParseCuidPipe) replyId: string,
    @Body() body: ReplyContentDto,
  ) {
    const userId = req.user.userId;
    if (body.content === undefined) throw new BadRequestException('내용을 입력해주세요.');

    return this.inquiryService.updateReply(userId, replyId, body);
  }

  // 문의 답변 삭제
  @UseGuards(JwtAuthGuard)
  @Delete(':replyId/replies')
  deleteReply(@Req() req: { user: AuthUser }, @Param('replyId', ParseCuidPipe) replyId: string) {
    const userId = req.user.userId;

    return this.inquiryService.deleteReply(userId, replyId);
  }
}
