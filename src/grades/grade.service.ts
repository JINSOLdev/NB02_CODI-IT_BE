import { Injectable } from '@nestjs/common';
import { GradeLevel } from '@prisma/client';
import { GradeRepo } from './grade.repository';
import { TxLike } from 'src/points/points.types';
import { getEarnRate, getGradeByAmount, getNextGradeInfo } from './grade.util';

@Injectable()
export class GradeService {
  constructor(private readonly repo: GradeRepo) {}

  // 현재 등급 및 누적 구매액 조회
  async getCurrentGrade(
    userId: string,
    tx: TxLike = this.repo.prismaSvc,
    thisOrderIdToExclude?: string,
  ): Promise<{ lifetime: number; grade: GradeLevel }> {
    const lifetime = await this.repo.sumLifetime(
      userId,
      tx,
      thisOrderIdToExclude,
    );
    return { lifetime, grade: getGradeByAmount(lifetime) };
  }

  // 등급별 적립율
  getEarnRate(level: GradeLevel): number {
    return getEarnRate(level);
  }

  // 다음 등급 정보
  getNextGradeInfo(lifetime: number): { next?: GradeLevel; need?: number } {
    return getNextGradeInfo(lifetime);
  }

  // 사용자 등급 저장(표시용 캐시)
  async syncUserGrade(
    userId: string,
    level: GradeLevel,
    tx: TxLike,
  ): Promise<void> {
    await this.repo.saveUserGrade(userId, level, tx);
  }
}
