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

@Controller('api/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard)
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
