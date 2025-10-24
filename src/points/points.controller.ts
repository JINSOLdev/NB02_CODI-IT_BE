import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { PointsService } from './points.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Points')
@ApiBearerAuth()
@Controller('api/users/me')
export class PointsController {
  constructor(private readonly points: PointsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('points')
  @ApiOperation({ summary: '내 포인트 및 등급 요약 조회' })
  getMyPoints(@Req() req: { user: { userId: string } }) {
    return this.points.getMyPointSummary(req.user.userId);
  }
}
