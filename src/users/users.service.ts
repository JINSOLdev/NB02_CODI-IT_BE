import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import type { Prisma, User, UserType } from '@prisma/client';
import { toUserPayload, UserPayload } from './users.mapper';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findById(id);
  }

  async create(dto: CreateUserDto): Promise<{ user: UserPayload }> {
    const email = dto.email.trim().toLowerCase();

    // 이메일 중복 확인
    const exists = await this.usersRepo.existsByEmail(email);
    if (exists) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const userType: UserType = dto.type ?? 'BUYER';

    const created = await this.usersRepo.create({
      nickname: dto.name,
      email,
      passwordHash,
      type: userType,
      image: null,
    });

    return { user: toUserPayload(created) };
  }

  async getMe(userId: string): Promise<UserPayload> {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new NotFoundException('유저 정보를 찾을 수 없습니다.');
    return toUserPayload(user);
  }

  async updateMe(userId: string, dto: UpdateUserDto): Promise<UserPayload> {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new NotFoundException('유저 정보를 찾을 수 없습니다.');

    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('현재 비밀번호가 일치하지 않습니다.');
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.name) data.nickname = dto.name;
    if (dto.image !== undefined) data.image = dto.image;
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.usersRepo.updateById(userId, data);
    return toUserPayload(updated);
  }
  async getMyLikes(userId: string) {
    const rows = await this.usersRepo.findLikesByUserId(userId);
    // 스키마 필드명 그대로 반환 (detailAddress, phoneNumber)
    return rows.map((r) => ({
      storeId: r.storeId,
      userId: r.userId,
      store: {
        id: r.store.id,
        name: r.store.name,
        address: r.store.address,
        detailAddress: r.store.detailAddress,
        phoneNumber: r.store.phoneNumber,
        content: r.store.content,
        image: r.store.image ?? null,
        createdAt: r.store.createdAt,
        updatedAt: r.store.updatedAt,
      },
    }));
  }
}
