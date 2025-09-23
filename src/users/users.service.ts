import { Injectable, ConflictException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import type { User, UserType } from '@prisma/client';
import { toUserPayload, UserPayload } from './users.mapper';
import * as bcrypt from 'bcrypt';

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
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const userType: UserType = (dto.type ?? 'BUYER') as UserType;

    const created = await this.usersRepo.create({
      nickname: dto.name,
      email,
      passwordHash,
      type: userType,
      image: null,
    });

    return { user: toUserPayload(created) };
  }
}
