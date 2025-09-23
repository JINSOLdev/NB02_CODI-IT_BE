import { User } from '@prisma/client';
import { GRADE_MAP } from '../grades/grade.constants';

export type UserPayload = {
  id: string;
  email: string;
  name: string;
  type: 'BUYER' | 'SELLER';
  points: string;
  image: string | null;
  grade: { id: string; name: string; rate: number; minAmount: number };
};

// 굳이 변환 함수 필요 없음 -> 그대로 매핑
export const toUserPayload = (u: User): UserPayload => ({
  id: u.id,
  email: u.email,
  name: u.nickname,
  type: u.type,
  points: String(u.points),
  image: u.image ?? null,
  grade: GRADE_MAP[u.gradeLevel],
});
