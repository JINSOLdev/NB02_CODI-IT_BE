import { BadRequestException, Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { AuthUser } from 'src/auth/auth.types';
import { InquiryService } from './inquiry.service';
import { GetInquiriesDto, UpdateInquiryDto } from './inquiry.dto';

@Controller('api/inquiries')
export class InquiryController {
  constructor(private inquiryService: InquiryService) { }

  // 내가 작성한 문의 목록 조회
  @UseGuards(JwtAuthGuard)
  @Get()
  getMyInquiries(
    @Req() req: { user: AuthUser },
    @Query() query: GetInquiriesDto,
  ) {
    const user = req.user;

    return this.inquiryService.getMyInquiries(user.userId, query);
  }

  // 문의 상세 조회
  @Get(':inquiryId')
  getInquiryDetail(@Param('inquiryId') inquiryId: string) {
    return this.inquiryService.getInquiryDetail(inquiryId);
  }

  // 문의 수정
  @UseGuards(JwtAuthGuard)
  @Patch(':inquiryId')
  updateInquiry(
    @Req() req: { user: AuthUser },
    @Param('inquiryId') inquiryId: string,
    @Body() body: UpdateInquiryDto,
  ) {
    const userId = req.user.userId;
    const { title, content, isSecret } = body;

    // 수정 요청 시 최소 1개의 필드가 입력되어야 함
    if (title === undefined && content === undefined && isSecret === undefined) {
      throw new BadRequestException('수정할 필드를 최소 1개 이상 입력해주세요.');
    }

    // undefined 값만 필터링
    const updateData: Partial<UpdateInquiryDto> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (isSecret !== undefined) updateData.isSecret = isSecret;

    return this.inquiryService.updateInquiry(userId, inquiryId, updateData);
  }
}