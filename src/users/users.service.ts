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
    // 이메일 정규화(소문자/공백제거)
    const email = dto.email.trim().toLowerCase();

    // 중복 체크
    const exists = await this.usersRepo.findByEmail(email);
    if (exists) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    // ✅ 비밀번호 해시
    const passwordHash = await bcrypt.hash(dto.password, 10);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const userType: UserType = (dto.type ?? 'BUYER') as UserType;

    // 생성
    const created = await this.usersRepo.create({
      nickname: dto.name,
      email,
      passwordHash,
      type: userType,
      image: null,
      // points, gradeLevel 등 스키마의 default가 있다면 생략 가능
    });

    return { user: toUserPayload(created) };
  }
}
