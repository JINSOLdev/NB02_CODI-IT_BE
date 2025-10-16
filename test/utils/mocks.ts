import { JwtService } from '@nestjs/jwt';

export const createPrismaMock = () => ({
  user: {
    findUnique: jest.fn(),
  },
  session: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
});

export const createJwtMock = () =>
  ({
    signAsync: jest.fn(() => 'signed.access'),
  }) as unknown as jest.Mocked<JwtService>;

export const aUser = (over: Partial<any> = {}) => ({
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
