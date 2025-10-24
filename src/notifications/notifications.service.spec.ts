import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { Notification, UserType } from '@prisma/client';

const now = new Date('2025-01-01T00:00:00Z');

const makeNotification = (over: Partial<Notification> = {}): Notification => ({
  id: 'alarm-1',
  userId: 'user-1',
  type: 'SYSTEM',
  message: 'hello',
  isRead: false,
  createdAt: now,
  updatedAt: now,
  ...over,
});

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: jest.Mocked<NotificationsRepository>;

  beforeEach(() => {
    repository = {
      findUserType: jest.fn(),
      findMany: jest.fn(),
      findByIdAndUser: jest.fn(),
      markRead: jest.fn(),
    };

    service = new NotificationsService(repository);
  });

  describe('unread', () => {
    it('판매자 > isRead=false 조회', async () => {
      repository.findUserType.mockResolvedValue('SELLER' as UserType);
      repository.findMany.mockResolvedValue([
        makeNotification({ id: 'a1', isRead: false, type: 'SYSTEM' }),
      ]);

      const result = await service.unread('user-1');

      expect(repository.findUserType).toHaveBeenCalledWith('user-1');
      expect(repository.findMany).toHaveBeenCalledWith({
        userId: 'user-1',
        isRead: false,
        types: expect.arrayContaining([
          'NEW_INQUIRY',
          'OUT_OF_STOCK_SELLER',
          'SYSTEM',
        ]),
      });

      expect(result).toEqual([
        {
          id: 'a1',
          userId: 'user-1',
          content: 'hello',
          isChecked: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ]);
    });
  });

  describe('list', () => {
    it('userId 없으면 BadRequestException', async () => {
      await expect(service.list('' as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('구매자 > 전체 목록 조회, 없으면 NotFoundException', async () => {
      repository.findUserType.mockResolvedValue('BUYER' as UserType);
      repository.findMany.mockResolvedValue([]);

      await expect(service.list('user-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(repository.findUserType).toHaveBeenCalledWith('user-1');
      expect(repository.findMany).toHaveBeenCalledWith({
        userId: 'user-1',
        types: expect.arrayContaining([
          'OUT_OF_STOCK_CART',
          'OUT_OF_STOCK_ORDER',
          'INQUIRY_ANSWERED',
          'SYSTEM',
        ]),
      });
    });

    it('응답 반환', async () => {
      repository.findUserType.mockResolvedValue('BUYER' as UserType);
      repository.findMany.mockResolvedValue([
        makeNotification({ id: 'a1' }),
        makeNotification({ id: 'a2', message: 'world', isRead: true }),
      ]);

      const result = await service.list('user-1');

      expect(result).toEqual([
        {
          id: 'a1',
          userId: 'user-1',
          content: 'hello',
          isChecked: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
        {
          id: 'a2',
          userId: 'user-1',
          content: 'world',
          isChecked: true,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ]);
    });
  });

  describe('check', () => {
    it('알람 없음 NotFoundException', async () => {
      repository.findByIdAndUser.mockResolvedValue(null);

      await expect(service.check('user-1', 'alarm-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.findByIdAndUser).toHaveBeenCalledWith(
        'alarm-1',
        'user-1',
      );
    });

    it('이미 읽은 알람 BadRequestException', async () => {
      repository.findByIdAndUser.mockResolvedValue(
        makeNotification({ isRead: true }),
      );
      repository.findUserType.mockResolvedValue('BUYER' as UserType);

      await expect(service.check('user-1', 'alarm-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('읽음 처리', async () => {
      repository.findByIdAndUser.mockResolvedValue(
        makeNotification({ id: 'alarm-9', isRead: false }),
      );
      repository.findUserType.mockResolvedValue('SELLER' as UserType);

      await service.check('user-1', 'alarm-9');

      expect(repository.findUserType).toHaveBeenCalledWith('user-1');
      expect(repository.markRead).toHaveBeenCalledWith('alarm-9');
    });
  });
});
