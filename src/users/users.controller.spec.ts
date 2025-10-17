import { Test } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { AuthUser } from '../auth/auth.types';
import type { UserPayload } from './users.mapper';

// 도메인 더미/헬퍼
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

const makeAuthUser = (userId: string): AuthUser => ({
  userId,
  email: 'test@example.com',
  type: 'BUYER',
  points: 0,
  grade: {
    id: '',
    name: '',
    rate: 0,
    minAmount: 0,
  },
});

// Service Mock 타입 정의
type UsersServiceMock = jest.Mocked<
  Pick<
    UsersService,
    'create' | 'getMe' | 'updateMe' | 'getMyLikes' | 'deleteMe' | 'findById'
  >
>;

// 테스트
describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersServiceMock;

  beforeEach(async () => {
    const svc: UsersServiceMock = {
      create: jest.fn(),
      getMe: jest.fn(),
      updateMe: jest.fn(),
      getMyLikes: jest.fn(),
      deleteMe: jest.fn(),
      findById: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: svc }],
    }).compile();

    controller = moduleRef.get(UsersController);
    service = moduleRef.get(UsersService);

    jest.clearAllMocks();
  });

  it('POST /api/users - 회원가입 위임', async () => {
    const dto: CreateUserDto = {
      email: 'new@ex.com',
      password: 'pw1234',
      name: '새유저',
      type: 'BUYER',
    };
    service.create.mockResolvedValue({ user: aUserPayload({ id: 'u100' }) });

    const out = await controller.signup(dto);

    const calls = service.create.mock.calls;
    expect(calls.length).toBe(1);
    const [arg0] = calls[0] as [CreateUserDto];
    expect(arg0).toEqual(dto);

    expect(out.user.id).toBe('u100');
  });

  it('GET /api/users/me - 내 정보', async () => {
    const me = aUserPayload();
    service.getMe.mockResolvedValue(me);
    const authUser = makeAuthUser('u1');

    const out = await controller.getMe(authUser);

    const calls = service.getMe.mock.calls;
    expect(calls.length).toBe(1);
    const [uid] = calls[0] as [string];
    expect(uid).toBe('u1');

    expect(out.id).toBe('u1');
  });

  it('PATCH /api/users/me - 내 정보 수정', async () => {
    const authUser = makeAuthUser('u1');
    const dto: UpdateUserDto = { name: '바뀐이름', currentPassword: 'curPw' };
    service.updateMe.mockResolvedValue(aUserPayload({ name: '바뀐이름' }));

    const out = await controller.updateMe(authUser, dto);

    const calls = service.updateMe.mock.calls;
    expect(calls.length).toBe(1);
    const [uid, body] = calls[0] as [string, UpdateUserDto];
    expect(uid).toBe('u1');
    expect(body).toEqual(dto);

    expect(out.name).toBe('바뀐이름');
  });

  it('GET /api/users/me/likes - 관심 스토어 목록', async () => {
    const authUser = makeAuthUser('u1');
    service.getMyLikes.mockResolvedValue([]);

    const out = await controller.getMyLikes(authUser);

    const calls = service.getMyLikes.mock.calls;
    expect(calls.length).toBe(1);
    const [uid] = calls[0] as [string];
    expect(uid).toBe('u1');

    expect(out).toEqual([]);
  });

  it('DELETE /api/users/delete - 회원 탈퇴', async () => {
    const authUser = makeAuthUser('u1');
    service.deleteMe.mockResolvedValue(undefined);

    const out = await controller.deleteMe(authUser);

    const calls = service.deleteMe.mock.calls;
    expect(calls.length).toBe(1);
    const [uid] = calls[0] as [string];
    expect(uid).toBe('u1');

    expect(out).toEqual({ message: '회원 탈퇴가 완료되었습니다.' });
  });
});
