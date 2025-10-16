import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { PointsService } from './points.service';

@Controller('api/users/me')
export class PointsController {
  constructor(private readonly points: PointsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('points')
  getMyPoints(@Req() req: { user: { userId: string } }) {
    return this.points.getMyPointSummary(req.user.userId);
  }
}
