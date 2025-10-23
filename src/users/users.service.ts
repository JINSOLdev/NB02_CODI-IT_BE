import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import type { Prisma, User, UserType } from '@prisma/client';
import {
  toUserPayload,
  UserPayload,
  toFavoriteStoreList,
  FavoriteStoreItemDto,
} from './users.mapper';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly s3Service: S3Service,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findById(id);
  }

  async create(dto: CreateUserDto): Promise<{ user: UserPayload }> {
    const email = dto.email.trim().toLowerCase();

    const exists = await this.usersRepo.existsByEmail(email);
    if (exists) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const userType: UserType = dto.type ?? 'BUYER';

    const created = await this.usersRepo.create({
      name: dto.name,
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

  async updateMe(
    userId: string,
    dto: UpdateUserDto,
    image?: Express.Multer.File,
  ): Promise<UserPayload> {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new NotFoundException('유저 정보를 찾을 수 없습니다.');

    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('현재 비밀번호가 일치하지 않습니다.');
    }

    const data: Prisma.UserUpdateInput = {};

    if (dto.name) data.name = dto.name;
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    // 파일이 온 경우에만 S3 업로드 → URL 저장
    if (image && image.buffer && image.mimetype?.startsWith('image/')) {
      const { url } = await this.s3Service.uploadFile(image);
      data.image = url;
    } else if (dto.image !== undefined) {
      data.image = dto.image;
    }

    const updated = await this.usersRepo.updateById(userId, data);
    return toUserPayload(updated);
  }

  async getMyLikes(userId: string): Promise<FavoriteStoreItemDto[]> {
    const rows = await this.usersRepo.findLikesByUserId(userId);
    return toFavoriteStoreList(rows);
  }

  async deleteMe(userId: string): Promise<void> {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');
    await this.usersRepo.deleteById(userId);
  }
}
