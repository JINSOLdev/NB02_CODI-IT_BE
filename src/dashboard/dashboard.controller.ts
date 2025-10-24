import {
  Get,
  Req,
  UseGuards,
  Controller,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { AuthUser } from 'src/auth/auth.types';
import { DashboardService } from './dashboard.service';
import { UserType } from '@prisma/client';
import { ApiOperation, ApiHeader, ApiResponse } from '@nestjs/swagger';

@Controller('api/dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '대시보드 조회' })
  @ApiHeader({
    name: 'Authorization',
    description: 'JWT 토큰',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '대시보드 조회 성공',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @Get()
  async getDashboard(@Req() req: { user: AuthUser }) {
    const user = req.user;
    if (user.type !== UserType.SELLER) {
      throw new ForbiddenException('판매자만 접근 가능합니다');
    }
    const salesData = await this.dashboardService.getDashboard(user.userId);
    if (!salesData) {
      throw new NotFoundException('판매자 정보를 찾을 수 없습니다');
    }
    return salesData;
  }
}
