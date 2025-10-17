import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

// Prisma 관련 타입
interface DbUser {
  id: string;
  email: string;
  name: string;
  type: 'BUYER' | 'SELLER';
  points: number;
  image: string | null;
  gradeLevel: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionRow {
  userId: string;
  refreshToken: string;
  expiresAt: Date;
}

type UserFindUniqueArgs = { where: { email?: string; id?: string } };
type SessionCreateArgs = { data: SessionRow };
type SessionFindUniqueArgs = { where: { refreshToken: string } };
type SessionUpdateArgs = {
  where: { refreshToken: string };
  data: { refreshToken: string; expiresAt: Date };
};
type SessionDeleteArgs = { where: { refreshToken: string } };
type SessionDeleteManyArgs = { where: { userId: string } };

// PrismaService mock 타입
type PrismaMock = {
  user: {
    findUnique: jest.Mock<Promise<DbUser | null>, [UserFindUniqueArgs]>;
  };
  session: {
    create: jest.Mock<Promise<{ id: string }>, [SessionCreateArgs]>;
    findUnique: jest.Mock<Promise<SessionRow | null>, [SessionFindUniqueArgs]>;
    update: jest.Mock<Promise<unknown>, [SessionUpdateArgs]>;
    delete: jest.Mock<Promise<unknown>, [SessionDeleteArgs]>;
    deleteMany: jest.Mock<Promise<{ count: number }>, [SessionDeleteManyArgs]>;
  };
};

const createPrismaMock = (): PrismaMock => ({
  user: {
    findUnique: jest.fn<Promise<DbUser | null>, [UserFindUniqueArgs]>(),
  },
  session: {
    create: jest.fn<Promise<{ id: string }>, [SessionCreateArgs]>(),
    findUnique: jest.fn<Promise<SessionRow | null>, [SessionFindUniqueArgs]>(),
    update: jest.fn<Promise<unknown>, [SessionUpdateArgs]>(),
    delete: jest.fn<Promise<unknown>, [SessionDeleteArgs]>(),
    deleteMany: jest.fn<Promise<{ count: number }>, [SessionDeleteManyArgs]>(),
  },
});

const createJwtMock = (): jest.Mocked<JwtService> =>
  ({
    signAsync: jest.fn<Promise<string>, [unknown, unknown?]>(() =>
      Promise.resolve('signed.access'),
    ),
  }) as unknown as jest.Mocked<JwtService>;

// bcrypt mock (require-await/스프레드 회피)
const bcryptCompare = jest.fn(
  (plain: string, hash: string): Promise<boolean> =>
    Promise.resolve(hash === `hashed:${plain}`),
);
const bcryptHash = jest.fn(
  (plain: string): Promise<string> => Promise.resolve(`hashed:${plain}`),
);

jest.mock('bcrypt', () => ({
  compare: (plain: string, hash: string) => bcryptCompare(plain, hash),
  hash: (plain: string) => bcryptHash(plain),
}));

// 도메인 더미/헬퍼
const aDbUser = (over: Partial<DbUser> = {}): DbUser => ({
  id: 'u1',
  email: 'test@example.com',
  name: '홍길동',
  type: 'BUYER',
  points: 0,
  image: null,
  gradeLevel: 'GREEN',
  passwordHash: 'hashed:password123!',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

// 테스트 반환 타입 헬퍼
type LoginResult = Awaited<ReturnType<AuthService['login']>>;
type RefreshResult = Awaited<ReturnType<AuthService['refresh']>>;
type LogoutResult = Awaited<ReturnType<AuthService['logout']>>;

// 테스트
describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaMock;
  let jwt: jest.Mocked<JwtService>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    jwt = createJwtMock();

    process.env.JWT_SECRET = 'secret';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.REFRESH_EXPIRES_DAYS = '7';

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('이메일 없음 → Unauthorized', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login('no@e.com', 'pw')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('비밀번호 불일치 → Unauthorized', async () => {
      prisma.user.findUnique.mockResolvedValue(
        aDbUser({ passwordHash: 'hashed:other' }),
      );

      await expect(
        service.login('test@example.com', 'password123!'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('성공 → access/refresh 발급 + 세션 저장', async () => {
      prisma.user.findUnique.mockResolvedValue(aDbUser());
      prisma.session.create.mockResolvedValue({ id: 's1' });

      const out: LoginResult = await service.login(
        'test@example.com',
        'password123!',
      );

      const signCalls = (jwt.signAsync as jest.Mock).mock.calls.length;
      expect(signCalls).toBe(1);

      const createCalls = (prisma.session.create as jest.Mock).mock.calls;
      expect(createCalls.length).toBe(1);

      type CreateArg = Parameters<PrismaMock['session']['create']>[0];
      const [createArg] = createCalls[0] as [CreateArg];

      expect(createArg.data.userId).toBe('u1');
      expect(typeof createArg.data.refreshToken).toBe('string');
      expect(createArg.data.expiresAt).toBeInstanceOf(Date);

      expect(out.user.id).toBe('u1');
      expect(out.accessToken).toBe('signed.access');
      expect(out.refreshToken).toEqual(expect.any(String));
    });
  });

  describe('refresh', () => {
    it('세션 없음/만료 → Unauthorized', async () => {
      prisma.session.findUnique.mockResolvedValue(null);

      await expect(service.refresh('badRT')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('유저 없음 → 세션 삭제 후 Unauthorized', async () => {
      const row: SessionRow = {
        userId: 'u-x',
        refreshToken: 'rt',
        expiresAt: new Date(Date.now() + 100_000),
      };
      prisma.session.findUnique.mockResolvedValue(row);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.session.delete.mockResolvedValue({});

      await expect(service.refresh('rt')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { refreshToken: 'rt' },
      });
    });

    it('성공 → RT 로테이션 + AT 재발급', async () => {
      const row: SessionRow = {
        userId: 'u1',
        refreshToken: 'rt',
        expiresAt: new Date(Date.now() + 100_000),
      };
      prisma.session.findUnique.mockResolvedValue(row);
      prisma.user.findUnique.mockResolvedValue(aDbUser());
      prisma.session.update.mockResolvedValue({});

      const out: RefreshResult = await service.refresh('rt');

      // 검증
      const updateCalls = (prisma.session.update as jest.Mock).mock.calls;
      expect(updateCalls.length).toBe(1);

      type UpdateArg = Parameters<PrismaMock['session']['update']>[0];
      const [updateArg] = updateCalls[0] as [UpdateArg];

      expect(updateArg.where.refreshToken).toBe('rt');
      expect(typeof updateArg.data.refreshToken).toBe('string');
      expect(updateArg.data.expiresAt).toBeInstanceOf(Date);

      const times = (jwt.signAsync as jest.Mock).mock.calls.length;
      expect(times).toBe(1);

      expect(out.accessToken).toBe('signed.access');
      expect(out.refreshToken).toEqual(expect.any(String));
    });

    it('만료된 세션 → Unauthorized', async () => {
      const expired: SessionRow = {
        userId: 'u1',
        refreshToken: 'rt',
        expiresAt: new Date(Date.now() - 1_000),
      };
      prisma.session.findUnique.mockResolvedValue(expired);

      await expect(service.refresh('rt')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('세션 삭제', async () => {
      prisma.session.deleteMany.mockResolvedValue({ count: 2 });

      const out: LogoutResult = await service.logout('u1');

      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
      });
      expect(out).toEqual({ message: '성공적으로 로그아웃되었습니다.' });
    });
  });
});
