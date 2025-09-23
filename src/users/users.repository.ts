import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma, User } from '@prisma/client';

// 로그인 비교 등에 쓰기 위한 최소 필드 세트
export type UserWithPassword = Pick<
  User,
  'id' | 'email' | 'nickname' | 'type' | 'gradeLevel' | 'passwordHash'
>;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string | undefined | null): Promise<User | null> {
    if (!id) return null;
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * 이메일로 사용자 조회 (비밀번호 검증 용도이므로 passwordHash 포함)
   */
  async findByEmail(email: string): Promise<UserWithPassword | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        nickname: true,
        type: true,
        gradeLevel: true,
        passwordHash: true,
      },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async createUnchecked(data: Prisma.UserUncheckedCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }
}
