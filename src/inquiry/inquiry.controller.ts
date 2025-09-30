import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { AnswerStatus } from "@prisma/client";
import { JwtAuthGuard } from "src/auth/jwt.guard";
import { AuthUser } from "src/auth/auth.types";
import { InquiryService } from "./inquiry.service";
import { GetInquiriesDto } from "./inquiry.dto";

@Controller('/api')
export class InquiryController {
  constructor(private inquiryService: InquiryService) { }

  // 내가 작성한 문의 목록 조회
  @UseGuards(JwtAuthGuard)
  @Get('/inquiries')
  getMyInquiries(@Req() req: { user: AuthUser }, @Query() query: GetInquiriesDto) {
    const user = req.user;

    return this.inquiryService.getMyInquiries(user.userId, query);
  }
}
