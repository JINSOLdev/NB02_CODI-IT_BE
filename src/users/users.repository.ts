import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma, User } from '@prisma/client';

export type UserForAuth = Pick<
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

  // 이메일 중복 확인용
  async existsByEmail(email: string): Promise<boolean> {
    const r = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return !!r;
  }

  // 로그인용 (해시 포함)
  async findByEmailForAuth(email: string): Promise<UserForAuth | null> {
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

  async findByEmail(email: string): Promise<UserForAuth | null> {
    return this.findByEmailForAuth(email);
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async createUnchecked(data: Prisma.UserUncheckedCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async updateById(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }
}
