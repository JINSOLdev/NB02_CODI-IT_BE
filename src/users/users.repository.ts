import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma, User } from '@prisma/client';
import { USER_AUTH_SELECT, FAVORITE_WITH_STORE_SELECT } from './users.select';

export type UserForAuth = Pick<
  User,
  'id' | 'email' | 'name' | 'type' | 'gradeLevel' | 'passwordHash'
>;

// favorite + store select 결과 타입 (정적 타입 안전)
export type FavoriteWithStoreRow = Prisma.FavoriteStoreGetPayload<{
  select: typeof FAVORITE_WITH_STORE_SELECT;
}>;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null>;
  async findById(id: string | undefined | null): Promise<User | null>;
  async findById(id: string | undefined | null): Promise<User | null> {
    if (!id) return null;
    return this.prisma.user.findUnique({ where: { id } });
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

  async exists(where: Prisma.UserWhereInput): Promise<boolean> {
    const count = await this.prisma.user.count({ where });
    return count > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.exists({ email });
  }

  async findByEmailForAuth(email: string): Promise<UserForAuth | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: USER_AUTH_SELECT,
    }) as Promise<UserForAuth | null>;
  }

  async findByEmail(email: string): Promise<UserForAuth | null> {
    return this.findByEmailForAuth(email);
  }

  // 관심 스토어 조회
  async findLikesByUserId(userId: string): Promise<FavoriteWithStoreRow[]> {
    return this.prisma.favoriteStore.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: FAVORITE_WITH_STORE_SELECT,
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
