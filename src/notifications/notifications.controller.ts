import { JwtAuthGuard } from './../auth/jwt.guard';
import {
  Controller,
  Get,
  Param,
  Patch,
  Sse,
  UnauthorizedException,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from 'src/auth/current-user.decorator';
import type { AuthUser } from 'src/auth/auth.types';
import { switchMap, startWith, type Observable } from 'rxjs';
import type { MessageEvent as SseMessageEvent } from '@nestjs/common';
import { TICKER$ } from './ticker.token';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@Controller('api/notifications')
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    @Inject(TICKER$) private readonly ticker$: Observable<number>,
  ) {}

  // 30초마다 미확인 알림 전송
  @ApiOperation({ summary: '실시간 알림 SSE' })
  @ApiResponse({
    status: 200,
    description: '실시간 알람 스트림',
  })
  @Sse('sse')
  sse(@CurrentUser() user: AuthUser) {
    if (!user?.userId) throw new UnauthorizedException('인증 실패했습니다.');

    return this.ticker$.pipe(
      startWith(0),
      switchMap(async (): Promise<SseMessageEvent> => {
        const data = await this.notifications.unread(user.userId);
        return { id: String(Date.now()), type: 'notifications', data };
      }),
    );
  }

  // 목록 조회
  @ApiOperation({ summary: '알림 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '알림 목록을 반환합니다.',
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청입니다.',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패했습니다.',
  })
  @ApiResponse({
    status: 403,
    description: '사용자를 찾지 못했습니다.',
  })
  @ApiResponse({
    status: 404,
    description: '알람을 찾지 못했습니다.',
  })
  @Get()
  async list(@CurrentUser() user: AuthUser) {
    if (!user?.userId) throw new UnauthorizedException('인증 실패했습니다.');

    return this.notifications.list(user.userId);
  }

  // 읽음 처리
  @ApiOperation({ summary: '읽음 처리' })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청입니다.',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패했습니다.',
  })
  @ApiResponse({
    status: 403,
    description: '사용자를 찾지 못했습니다.',
  })
  @ApiResponse({
    status: 404,
    description: '해당 알람이 없습니다.',
  })
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
