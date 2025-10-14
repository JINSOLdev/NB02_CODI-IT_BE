import { Notification } from '@prisma/client';

export type AlarmResponse = {
  id: string;
  userId: string;
  content: string;
  isChecked: boolean;
  createdAt: string;
  updatedAt: string;
};

export const toAlarmResponse = (n: Notification): AlarmResponse => ({
  id: n.id,
  userId: n.userId,
  content: n.message,
  isChecked: n.isRead,
  createdAt: n.createdAt.toISOString(),
  updatedAt: n.updatedAt.toISOString(),
});
