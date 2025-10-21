import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { of, Observable, lastValueFrom } from 'rxjs';
import { take, toArray } from 'rxjs/operators';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TICKER$ } from './ticker.token';
import type { AuthUser } from '../auth/auth.types';

class FakeAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    req.user = { userId: 'user-1' };
    return true;
  }
}

async function createApp(
  ticker$: Observable<number>,
  svcMock?: Partial<NotificationsService>,
) {
  const service = {
    unread: jest.fn(),
    list: jest.fn(),
    check: jest.fn(),
    ...(svcMock ?? {}),
  };

  const moduleRef = await Test.createTestingModule({
    controllers: [NotificationsController],
    providers: [
      { provide: NotificationsService, useValue: service },
      { provide: TICKER$, useValue: ticker$ },
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue(new FakeAuthGuard())
    .compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return { app, service: service as jest.Mocked<NotificationsService> };
}

describe('NotificationsController', () => {
  it('유저타입에 맞게 알람 목록 반환', async () => {
    const { app, service } = await createApp(of(0));
    service.list.mockResolvedValue([
      {
        id: 'a1',
        userId: 'user-1',
        content: 'hello',
        isChecked: false,
        createdAt: '2025-01-01T12:34:56.000Z',
        updatedAt: '2025-01-01T12:34:56.000Z',
      },
    ]);

    await request(app.getHttpServer())
      .get('/api/notifications')
      .expect(200)
      .expect(({ body }) => {
        expect(service.list).toHaveBeenCalledWith('user-1');
        expect(body).toEqual([
          expect.objectContaining({
            id: 'a1',
            content: 'hello',
            isChecked: false,
          }),
        ]);
      });

    await app.close();
  });

  it('알람 읽음 처리', async () => {
    const { app, service } = await createApp(of(0));
    service.check.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .patch('/api/notifications/alarm-9/check')
      .expect(200)
      .expect(({ body }) => {
        expect(service.check).toHaveBeenCalledWith('user-1', 'alarm-9');
        expect(body).toEqual({ message: '알람 읽음 처리 완료' });
      });

    await app.close();
  });

  it('첫번째 이벤트 알람', async () => {
    const { app, service } = await createApp(of(0));
    service.unread.mockResolvedValue([
      {
        id: 'a1',
        userId: 'user-1',
        content: 'hello',
        isChecked: false,
        createdAt: '2025-01-01T12:34:56.000Z',
        updatedAt: '2025-01-01T12:34:56.000Z',
      },
    ]);

    await request(app.getHttpServer())
      .get('/api/notifications/sse')
      .buffer(true)
      .parse((res, cb) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk.toString();
          if (data.includes('\n\n') || data.includes('\r\n\r\n')) {
            cb(null, data);
            res.destroy();
          }
        });
      })
      .expect(200)
      .expect('content-type', /text\/event-stream/)
      .expect((res) => {
        expect(service.unread).toHaveBeenCalledWith('user-1');
        const text = String(res.body);
        expect(text).toMatch(/event:\s*notifications/);
        expect(text).toMatch(/data:\s*\[/);
      });

    await app.close();
  });

  it('읽지 않은 알람 재호출', async () => {
    const { app, service } = await createApp(of(1, 2));
    service.unread.mockResolvedValue([]);

    const ctrl = app.get(NotificationsController);
    const user = { userId: 'user-1' } as AuthUser;

    const events = await lastValueFrom(ctrl.sse(user).pipe(take(3), toArray()));

    expect(service.unread).toHaveBeenCalledTimes(3);
    expect(events.length).toBe(3);

    for (const ev of events) {
      expect(ev).toEqual(
        expect.objectContaining({
          type: 'notifications',
          data: expect.any(Array),
        }),
      );
    }

    await app.close();
  });
});
