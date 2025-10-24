import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import type { RequestWithCookies, RequestWithUser } from './auth.types';
import { LoginDto } from './dto/login.dto';
import type { UserPayload } from './auth.service';

jest.mock('./cookie.util', () => {
  return {
    setRefreshCookie: jest.fn<void, [Response, string]>(),
    clearRefreshCookie: jest.fn<void, [Response]>(),
    REFRESH_COOKIE_NAME: 'rt',
  };
});

import {
  setRefreshCookie,
  clearRefreshCookie,
  REFRESH_COOKIE_NAME,
} from './cookie.util';

const aUserPayload = (over: Partial<UserPayload> = {}): UserPayload => ({
  id: 'u1',
  email: 'test@example.com',
  name: '홍길동',
  type: 'BUYER',
  points: '0',
  image: null,
  grade: { id: 'GREEN', name: 'GREEN', rate: 0, minAmount: 0 },
  ...over,
});

type AuthServiceMock = jest.Mocked<
  Pick<AuthService, 'login' | 'refresh' | 'logout'>
>;

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthServiceMock;

  const makeRes = (): Response =>
    ({
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    }) as unknown as Response;

  const makeCookieReq = (rt?: string): RequestWithCookies =>
    ({
      cookies: rt ? { [REFRESH_COOKIE_NAME]: rt } : {},
    }) as RequestWithCookies;

  const makeUserReq = (userId: string): RequestWithUser =>
    ({
      user: { userId },
    }) as RequestWithUser;

  beforeEach(async () => {
    const serviceMock: AuthServiceMock = {
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: serviceMock }],
    }).compile();

    controller = moduleRef.get(AuthController);
    service = moduleRef.get(AuthService);

    jest.clearAllMocks();
  });

  it('POST /login - 성공 시 setRefreshCookie 호출 및 accessToken 반환', async () => {
    service.login.mockResolvedValue({
      user: aUserPayload({ id: 'u1' }),
      accessToken: 'at',
      refreshToken: 'rtok',
    });

    const dto: LoginDto = { email: 'e', password: 'p' };
    const res = makeRes();

    const out = await controller.login(dto, res);

    expect(service.login).toHaveBeenCalledWith('e', 'p');
    expect(setRefreshCookie).toHaveBeenCalledWith(res, 'rtok');

    expect(out).toMatchObject({ user: { id: 'u1' }, accessToken: 'at' });
  });

  it('POST /refresh - 쿠키 없으면 400', async () => {
    const req = makeCookieReq(undefined);
    const res = makeRes();

    await expect(controller.refresh(req, res)).rejects.toThrow(
      'Refresh token cookie missing',
    );
  });

  it('POST /refresh - RT 읽어서 서비스 호출, 새 RT로 교체', async () => {
    service.refresh.mockResolvedValue({
      accessToken: 'newAT',
      refreshToken: 'newRT',
    });

    const req = makeCookieReq('oldRT');
    const res = makeRes();

    const out = await controller.refresh(req, res);

    expect(service.refresh).toHaveBeenCalledWith('oldRT');
    expect(setRefreshCookie).toHaveBeenCalledWith(res, 'newRT');
    expect(out).toEqual({ accessToken: 'newAT' });
  });

  it('POST /logout - 서비스 호출 및 쿠키 삭제', async () => {
    service.logout.mockResolvedValue({
      message: '성공적으로 로그아웃되었습니다.',
    });

    const req = makeUserReq('u1');
    const res = makeRes();

    const out = await controller.logout(req, res);

    expect(service.logout).toHaveBeenCalledWith('u1');
    expect(clearRefreshCookie).toHaveBeenCalledWith(res);
    expect(out).toEqual({ message: '성공적으로 로그아웃되었습니다.' });
  });
});
