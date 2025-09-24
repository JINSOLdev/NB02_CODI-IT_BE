import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import type { User } from '@prisma/client';
import { GRADE_MAP, GradeLevel } from '../grades/grade.constants';

// 날짜 더하기 (date-fns 없이)
function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

// 환경변수 숫자 파싱 헬퍼
function getNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export type UserPayload = {
  id: string;
  email: string;
  name: string;
  type: 'BUYER' | 'SELLER';
  points: string;
  image: string | null;
  grade: { id: string; name: string; rate: number; minAmount: number };
};

type LoginResult = {
  user: UserPayload;
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private toUserPayload(u: User): UserPayload {
    const gradeKey = u.gradeLevel as GradeLevel;
    return {
      id: u.id,
      email: u.email,
      name: u.nickname,
      type: u.type as 'BUYER' | 'SELLER',
      points: String(u.points),
      image: u.image ?? null,
      grade: GRADE_MAP[gradeKey],
    };
  }

  // JWT 액세스 토큰 + 리프레시 토큰 발급
  private async issueTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      id: user.id,
      userId: user.id,
      email: user.email,
      type: user.type as 'BUYER' | 'SELLER',
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    });

    const refreshToken = crypto.randomUUID();
    const refreshDays = getNumberEnv('REFRESH_EXPIRES_DAYS', 7);
    const expiresAt = addDays(new Date(), refreshDays);

    if (Number.isNaN(expiresAt.getTime())) {
      throw new Error(
        `expiresAt invalid. raw=${process.env.REFRESH_EXPIRES_DAYS}, parsed=${refreshDays}`,
      );
    }

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  // 로그인 이메일/비밀번호 검증 + 토큰 발급
  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('잘못된 요청입니다.');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('잘못된 요청입니다.');

    const { accessToken, refreshToken } = await this.issueTokens(user);
    return {
      user: this.toUserPayload(user),
      accessToken,
      refreshToken,
    };
  }

  // 토큰 재발급
  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
    });
    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Unauthorized');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
    });
    if (!user) {
      await this.prisma.session.delete({ where: { refreshToken } });
      throw new UnauthorizedException('Unauthorized');
    }

    // RT 로테이션 + 슬라이딩 만료
    const newRefreshToken = crypto.randomUUID();
    const refreshDays = getNumberEnv('REFRESH_EXPIRES_DAYS', 7);
    const newExpiresAt = addDays(new Date(), refreshDays);

    await this.prisma.session.update({
      where: { refreshToken },
      data: { refreshToken: newRefreshToken, expiresAt: newExpiresAt },
    });

    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        id: user.id,
        userId: user.id,
        email: user.email,
        type: user.type as 'BUYER' | 'SELLER',
      },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
      },
    );

    return { accessToken, refreshToken: newRefreshToken };
  }

  // 로그아웃(세션삭제)
  async logout(userId: string): Promise<{ message: string }> {
    await this.prisma.session.deleteMany({ where: { userId } });
    return { message: '성공적으로 로그아웃되었습니다.' };
  }
}
