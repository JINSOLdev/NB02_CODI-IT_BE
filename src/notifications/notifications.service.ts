import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { toAlarmResponse } from './notifications.mapper';
import { allowedByUserType } from './types/allowed-types.type';

@Injectable()
export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}

  // 30초마다 미확인 알림 전송
  async unread(userId: string) {
    const userType = await this.repository.findUserType(userId);
    const allowed = allowedByUserType(userType);

    if (!allowed?.length) throw new ForbiddenException('접근 권한이 없습니다.');

    const list = await this.repository.findMany({
      userId,
      isRead: false,
      types: allowed,
    });
    return list.map(toAlarmResponse);
  }

  // 목록 조회
  async list(userId: string) {
    if (!userId) throw new BadRequestException('잘못된 요청 입니다.');

    const userType = await this.repository.findUserType(userId);
    const allowed = allowedByUserType(userType);
    if (!allowed?.length)
      throw new ForbiddenException('사용자를 찾지 못했습니다.');

    const list = await this.repository.findMany({ userId, types: allowed });

    if (!list.length) throw new NotFoundException('알람을 찾지 못했습니다.');

    return list.map(toAlarmResponse);
  }

  // 읽음 처리
  async check(userId: string, alarmId: string) {
    const alarm = await this.repository.findByIdAndUser(alarmId, userId);
    if (!alarm) throw new NotFoundException('해당 알람이 없습니다.');

    const userType = await this.repository.findUserType(userId);
    const allowed = allowedByUserType(userType);
    if (!allowed?.length)
      throw new ForbiddenException('사용자를 찾지 못했습니다.');

    if (alarm.isRead) throw new BadRequestException('잘못된 요청 입니다.');

    await this.repository.markRead(alarm.id);
  }
}
