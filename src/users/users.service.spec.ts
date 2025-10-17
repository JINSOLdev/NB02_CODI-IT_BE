import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Prisma, User, UserType, GradeLevel } from '@prisma/client';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import { toUserPayload, type UserPayload } from './users.mapper';

// bcrypt Mock
const bcryptCompare = jest.fn(
  (plain: string, hash: string): Promise<boolean> =>
    Promise.resolve(hash === `hashed:${plain}`),
);
const bcryptHash = jest.fn(
  (plain: string, saltOrRounds: number): Promise<string> => {
    void saltOrRounds;
    return Promise.resolve(`hashed:${plain}`);
  },
);
jest.mock('bcrypt', () => ({
  compare: (plain: string, hash: string) => bcryptCompare(plain, hash),
  hash: (plain: string, saltOrRounds: number) =>
    bcryptHash(plain, saltOrRounds),
}));

// 도메인 타입/더미/헬퍼
type DbUser = User;

const aDbUser = (over: Partial<DbUser> = {}): DbUser => ({
  id: 'u1',
  email: 'test@example.com',
  name: '홍길동',
  type: 'BUYER' as UserType,
  points: 0,
  image: null,
  passwordHash: 'hashed:pw1234!',
  gradeLevel: 'GREEN' as GradeLevel,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...over,
});

const payloadOf = (u: DbUser): UserPayload => toUserPayload(u);

// UsersRepository Mock
type UsersRepoMock = {
  existsByEmail: jest.Mock<Promise<boolean>, [string]>;
  create: jest.Mock<
    Promise<DbUser>,
    [
      {
        name: string;
        email: string;
        passwordHash: string;
        type: UserType;
        image: string | null;
      },
    ]
  >;
  findById: jest.Mock<Promise<DbUser | null>, [string]>;
  updateById: jest.Mock<Promise<DbUser>, [string, Prisma.UserUpdateInput]>;
  findLikesByUserId: jest.Mock<Promise<any[]>, [string]>;
  deleteById: jest.Mock<Promise<void>, [string]>;
};

const createRepoMock = (): UsersRepoMock => ({
  existsByEmail: jest.fn<Promise<boolean>, [string]>(),
  create: jest.fn<
    Promise<DbUser>,
    [
      {
        name: string;
        email: string;
        passwordHash: string;
        type: UserType;
        image: string | null;
      },
    ]
  >(),
  findById: jest.fn<Promise<DbUser | null>, [string]>(),
  updateById: jest.fn<Promise<DbUser>, [string, Prisma.UserUpdateInput]>(),
  findLikesByUserId: jest.fn<Promise<any[]>, [string]>(),
  deleteById: jest.fn<Promise<void>, [string]>(),
});

// 테스트용 타입
type CreateReturn = Awaited<ReturnType<UsersService['create']>>;
type GetMeReturn = Awaited<ReturnType<UsersService['getMe']>>;
type UpdateMeReturn = Awaited<ReturnType<UsersService['updateMe']>>;

// 테스트
describe('UsersService', () => {
  let service: UsersService;
  let repo: UsersRepoMock;

  beforeEach(async () => {
    repo = createRepoMock();

    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: UsersRepository, useValue: repo }],
    }).compile();

    service = moduleRef.get(UsersService);
    jest.clearAllMocks();
  });

  describe('create (회원가입)', () => {
    it('이메일 중복이면 ConflictException', async () => {
      repo.existsByEmail.mockResolvedValue(true);

      const dto: CreateUserDto = {
        email: 'dup@example.com',
        password: 'pw',
        name: 'dup',
        type: 'BUYER',
      };

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );

      const calls = repo.existsByEmail.mock.calls;
      expect(calls.length).toBe(1);
      const [email] = calls[0];
      expect(email).toBe('dup@example.com');
    });

    it('성공하면 UserPayload 반환 + 비밀번호 해시 저장', async () => {
      repo.existsByEmail.mockResolvedValue(false);
      const created = aDbUser({
        id: 'u100',
        email: 'new@example.com',
        passwordHash: 'hashed:pw',
        type: 'BUYER',
      });
      repo.create.mockResolvedValue(created);

      const dto: CreateUserDto = {
        email: 'new@example.com',
        password: 'pw',
        name: '새 유저',
        type: 'BUYER',
      };

      const out: CreateReturn = await service.create(dto);

      const createCalls = repo.create.mock.calls;
      expect(createCalls.length).toBe(1);
      const [arg] = createCalls[0] as [
        {
          name: string;
          email: string;
          passwordHash: string;
          type: UserType;
          image: string | null;
        },
      ];
      expect(arg.email).toBe('new@example.com');
      expect(arg.name).toBe('새 유저');
      expect(arg.type).toBe('BUYER');
      expect(arg.image).toBeNull();
      expect(arg.passwordHash).toBe('hashed:pw');

      expect(out.user).toEqual(payloadOf(created));
    });
  });

  describe('getMe', () => {
    it('유저 없으면 NotFoundException', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getMe('nope')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('성공', async () => {
      const u = aDbUser({ id: 'u1' });
      repo.findById.mockResolvedValue(u);

      const out: GetMeReturn = await service.getMe('u1');

      const calls = repo.findById.mock.calls;
      expect(calls.length).toBe(1);
      const [id] = calls[0];
      expect(id).toBe('u1');

      expect(out).toEqual(payloadOf(u));
    });
  });

  describe('updateMe', () => {
    it('유저 없으면 NotFoundException', async () => {
      repo.findById.mockResolvedValue(null);

      const dto: UpdateUserDto = { currentPassword: 'cur' };
      await expect(service.updateMe('u1', dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('현재 비밀번호 불일치면 UnauthorizedException', async () => {
      const u = aDbUser({ passwordHash: 'hashed:DIFF' });
      repo.findById.mockResolvedValue(u);

      const dto: UpdateUserDto = { currentPassword: 'cur' };
      await expect(service.updateMe('u1', dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      const calls = repo.findById.mock.calls;
      expect(calls.length).toBe(1);
    });

    it('이름/이미지만 변경', async () => {
      const u = aDbUser();
      repo.findById.mockResolvedValue(u);

      const updated = aDbUser({ name: '바뀜', image: 'img.png' });
      repo.updateById.mockResolvedValue(updated);

      const dto: UpdateUserDto = {
        currentPassword: 'pw1234!',
        name: '바뀜',
        image: 'img.png',
      };

      const out: UpdateMeReturn = await service.updateMe('u1', dto);

      const updCalls = repo.updateById.mock.calls;
      expect(updCalls.length).toBe(1);
      const [id, data] = updCalls[0];
      expect(id).toBe('u1');
      expect(data).toEqual(
        expect.objectContaining({
          name: '바뀜',
          image: 'img.png',
        }),
      );

      expect(data.passwordHash).toBeUndefined();

      expect(out).toEqual(payloadOf(updated));
    });

    it('비밀번호 변경 포함', async () => {
      const u = aDbUser();
      repo.findById.mockResolvedValue(u);

      const updated = aDbUser({ passwordHash: 'hashed:newPW' });
      repo.updateById.mockResolvedValue(updated);

      const dto: UpdateUserDto = {
        currentPassword: 'pw1234!',
        password: 'newPW',
      };

      const out: UpdateMeReturn = await service.updateMe('u1', dto);

      const updCalls = repo.updateById.mock.calls;
      expect(updCalls.length).toBe(1);
      const [id, data] = updCalls[0];
      expect(id).toBe('u1');
      expect(data.passwordHash).toBe('hashed:newPW');

      expect(out).toEqual(payloadOf(updated));
    });
  });

  describe('getMyLikes', () => {
    it('빈 배열 반환', async () => {
      repo.findLikesByUserId.mockResolvedValue([]);

      const out = await service.getMyLikes('u1');

      const calls = repo.findLikesByUserId.mock.calls;
      expect(calls.length).toBe(1);
      const [uid] = calls[0];
      expect(uid).toBe('u1');

      expect(out).toEqual([]);
    });
  });

  describe('deleteMe', () => {
    it('유저 없음 → NotFoundException', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.deleteMe('uX')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('성공 → repo.deleteById 호출', async () => {
      repo.findById.mockResolvedValue(aDbUser({ id: 'u1' }));
      repo.deleteById.mockResolvedValue();

      await service.deleteMe('u1');

      const delCalls = repo.deleteById.mock.calls;
      expect(delCalls.length).toBe(1);
      const [uid] = delCalls[0];
      expect(uid).toBe('u1');
    });
  });
});
