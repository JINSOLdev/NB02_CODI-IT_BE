import { JwtAuthGuard } from './../auth/jwt.guard';
import {
  Controller,
  Get,
  Param,
  Patch,
  Sse,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from 'src/auth/current-user.decorator';
import type { AuthUser } from 'src/auth/auth.types';
import { interval, startWith, switchMap } from 'rxjs';
import type { MessageEvent as SseMessageEvent } from '@nestjs/common';

@UseGuards(JwtAuthGuard)
@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  // 30초마다 미확인 알림 전송
  @Sse('sse')
  sse(@CurrentUser() user: AuthUser) {
    if (!user?.userId) throw new UnauthorizedException('인증 실패했습니다.');

    return interval(30000).pipe(
      startWith(0),
      switchMap(async (): Promise<SseMessageEvent> => {
        const data = await this.notifications.unread(user.userId);
        return { id: String(Date.now()), type: 'notifications', data };
      }),
    );
  }

  // 목록 조회
  @Get()
  async list(@CurrentUser() user: AuthUser) {
    if (!user?.userId) throw new UnauthorizedException('인증 실패했습니다.');

    return this.notifications.list(user.userId);
  }

  // 읽음 처리
  @Patch(':alarmId/check')
  async check(
    @CurrentUser() user: AuthUser,
    @Param('alarmId') alarmId: string,
  ) {
    if (!user?.userId) throw new UnauthorizedException('인증 실패했습니다.');

    await this.notifications.check(user.userId, alarmId);
    return { message: '알람 읽음 처리 완료' };
  }
}
