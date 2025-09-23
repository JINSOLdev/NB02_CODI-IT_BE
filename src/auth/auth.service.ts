import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import type { User } from '@prisma/client';
import { GRADE_MAP, GradeLevel } from '../grades/grade.constants';

/** 날짜 더하기 (date-fns 없이) */
function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

/** ENV 숫자 안전 파서 (NaN/0/음수면 기본값) */
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

  /** 명세서 포맷으로 user payload 생성 */
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

  /** 액세스/리프레시 토큰 발급 + 세션 저장 */
  private async issueTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // ✅ 최소 수정 포인트: 컨트롤러 호환을 위해 userId와 type을 페이로드에 포함
    const payload = {
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

    // 방어: 만약 이상한 값이면 즉시 중단
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

  /** 로그인 */
  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('잘못된 요청입니다.');

    // ✅ 해시 비교
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('잘못된 요청입니다.');

    const { accessToken, refreshToken } = await this.issueTokens(user);
    return {
      user: this.toUserPayload(user),
      accessToken,
      refreshToken,
    };
  }

  /** 토큰 재발급 (여기서는 accessToken만 재발급; 필요 시 RT 회전 로직로 확장 가능) */
  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
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

    // 현재 정책: 사용한 RT 폐기 (단회성)
    await this.prisma.session.delete({ where: { refreshToken } });

    // ✅ 재서명 시에도 동일 payload 키 유지 (userId/type 포함)
    const accessToken = await this.jwt.signAsync(
      {
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

    return { accessToken };
  }

  /** 로그아웃: 해당 유저의 모든 세션 제거 */
  async logout(userId: string): Promise<{ message: string }> {
    await this.prisma.session.deleteMany({ where: { userId } });
    return { message: '성공적으로 로그아웃되었습니다.' };
  }
}
