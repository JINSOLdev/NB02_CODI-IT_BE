import { GRADE_MAP, GradeLevel, GradePayload } from './grade.constants';

export function resolveGradeByAmount(totalAmount: number): {
  level: GradeLevel;
  payload: GradePayload;
} {
  // minAmount 오름차순 → 최종적으로 조건을 만족하는 가장 높은 등급으로 갱신
  const entries = Object.entries(GRADE_MAP) as [GradeLevel, GradePayload][];
  // 안전하게 minAmount 순 정렬
  entries.sort((a, b) => a[1].minAmount - b[1].minAmount);

  let current: [GradeLevel, GradePayload] = entries[0];
  for (const e of entries) {
    if (totalAmount >= e[1].minAmount) current = e;
  }
  const [level, payload] = current;
  return { level, payload };
}
