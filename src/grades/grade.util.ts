import { GRADE_MAP, GradeLevel, GradePayload } from './grade.constants';

export function resolveGradeByAmount(totalAmount: number): {
  level: GradeLevel;
  payload: GradePayload;
} {
  // 총 구매금액 기준 등급 산정
  // minAmount 기준 오름차순 정렬 후, totalAmount 이상인 마지막 등급 선택
  const entries = Object.entries(GRADE_MAP) as [GradeLevel, GradePayload][];

  entries.sort((a, b) => a[1].minAmount - b[1].minAmount);

  let current: [GradeLevel, GradePayload] = entries[0];
  for (const e of entries) {
    if (totalAmount >= e[1].minAmount) current = e;
  }
  const [level, payload] = current;
  return { level, payload };
}

// 총 구매금액으로 등급 산정
export function getGradeByAmount(totalAmount: number): GradeLevel {
  return resolveGradeByAmount(totalAmount).level;
}

// 등급별 적립율 반환
export function getEarnRate(level: GradeLevel): number {
  return GRADE_MAP[level].earnRate;
}

// 다음 등급 정보 반환
export function getNextGradeInfo(totalAmount: number): {
  next?: GradeLevel;
  need?: number;
} {
  const entries = Object.entries(GRADE_MAP) as [GradeLevel, GradePayload][];
  entries.sort((a, b) => a[1].minAmount - b[1].minAmount);

  // 현재 등급
  const { level: current } = resolveGradeByAmount(totalAmount);
  const idx = entries.findIndex(([lvl]) => lvl === current);

  const next = entries[idx + 1];
  if (!next) return {};
  const [nextLevel, nextPayload] = next;
  const need = Math.max(0, nextPayload.minAmount - totalAmount);
  return { next: nextLevel, need };
}
