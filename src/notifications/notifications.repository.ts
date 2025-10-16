import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationType, UserType } from '@prisma/client';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdAndUser(alarmId: string, userId: string) {
    return this.prisma.notification.findFirst({
      where: { id: alarmId, userId },
    });
  }

  async findUserType(userId: string): Promise<UserType> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { type: true },
    });

    if (!user) throw new Error('User not found');
    return user.type;
  }

  async findMany(params: {
    userId: string;
    isRead?: boolean;
    types?: NotificationType[];
  }) {
    const { userId, isRead, types } = params;
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(typeof isRead === 'boolean' ? { isRead } : {}),
        ...(types?.length ? { type: { in: types } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
