import { GradeLevel } from '@prisma/client';
import {
  getEarnRate,
  getGradeByAmount,
  getNextGradeInfo,
  resolveGradeByAmount,
} from './grade.util';
import { GRADE_MAP, GradePayload } from './grade.constants';

describe('grade.util', () => {
  // 등급을 minAmount 기준 오름차순 정렬 (상수 기반)
  const orderedEntries: ReadonlyArray<[GradeLevel, GradePayload]> = (
    Object.entries(GRADE_MAP) as [GradeLevel, GradePayload][]
  )
    .slice()
    .sort((a, b) => a[1].minAmount - b[1].minAmount);

  const orderedLevels: ReadonlyArray<GradeLevel> = orderedEntries.map(
    ([lv]) => lv,
  );

  // 기대 등급 계산기: amount 이상인 마지막 등급
  const expectedGradeByAmount = (amount: number): GradeLevel => {
    let cur: GradeLevel = orderedEntries[0][0];
    for (const [lv, payload] of orderedEntries) {
      if (amount >= payload.minAmount) cur = lv;
      else break;
    }
    return cur;
  };

  // 기대 다음 등급 계산기
  const expectedNextInfo = (
    totalAmount: number,
  ): { next?: GradeLevel; need?: number } => {
    // 현재 등급
    const current = expectedGradeByAmount(totalAmount);
    const idx = orderedLevels.findIndex((lv) => lv === current);
    const nextTuple = orderedEntries[idx + 1];
    if (!nextTuple) return {};
    const [nextLevel, nextPayload] = nextTuple;
    return {
      next: nextLevel,
      need: Math.max(0, nextPayload.minAmount - totalAmount),
    };
  };

  describe('getEarnRate', () => {
    it('모든 등급에 대해 GRADE_MAP의 earnRate와 동일하다', () => {
      for (const [lv, payload] of orderedEntries) {
        const rateFromUtil = getEarnRate(lv);
        const rateFromConst = payload.earnRate;
        expect(rateFromUtil).toBe(rateFromConst);
      }
    });
  });

  describe('getGradeByAmount', () => {
    it('임계값 경계(직전/정확히/직후)에서 기대 등급을 반환한다', () => {
      const samples: number[] = [];
      for (const [, payload] of orderedEntries) {
        const min = payload.minAmount;
        samples.push(Math.max(0, min - 1)); // 직전
        samples.push(min); // 정확히
        samples.push(min + 1); // 직후
      }

      for (const amount of samples) {
        const expected = expectedGradeByAmount(amount);
        expect(getGradeByAmount(amount)).toBe(expected);
      }
    });

    it('아주 큰 금액에서도 최상위 등급을 반환한다', () => {
      const huge = Number.MAX_SAFE_INTEGER;
      const top = orderedLevels[orderedLevels.length - 1];
      expect(getGradeByAmount(huge)).toBe(top);
    });

    it('음수 금액은 최소 등급으로 처리한다(경계 방어)', () => {
      const minLevel = orderedLevels[0];
      expect(getGradeByAmount(-1)).toBe(minLevel);
    });
  });

  describe('resolveGradeByAmount', () => {
    it('level과 payload를 동시에 올바르게 반환한다', () => {
      // 여러 샘플 금액으로 level/payload 일치성 확인
      const samples = [0, 1, 50, 10_000, 123_456, Number.MAX_SAFE_INTEGER];
      for (const amount of samples) {
        const { level, payload } = resolveGradeByAmount(amount);
        const expectedLevel = expectedGradeByAmount(amount);
        expect(level).toBe(expectedLevel);
        expect(payload).toBe(GRADE_MAP[level]); // 동일 객체(참조)여야 함
      }
    });
  });

  describe('getNextGradeInfo', () => {
    it('임계값 경계(직전/정확히/직후)에서 다음 등급과 필요 금액을 정확히 계산한다', () => {
      const samples: number[] = [];
      for (const [, payload] of orderedEntries) {
        const min = payload.minAmount;
        samples.push(Math.max(0, min - 1));
        samples.push(min);
        samples.push(min + 1);
      }

      for (const lifetime of samples) {
        const expected = expectedNextInfo(lifetime);
        const info = getNextGradeInfo(lifetime);
        expect(info).toEqual(expected);
      }
    });

    it('최상위 등급 이상이면 next/need가 undefined이다', () => {
      const top = orderedEntries[orderedEntries.length - 1];
      const justTop = top[1].minAmount;
      expect(getNextGradeInfo(justTop)).toEqual({});
      expect(getNextGradeInfo(justTop + 123_456)).toEqual({});
    });

    it('음수 lifetime도 다음 등급 계산이 가능해야 한다', () => {
      const negative = -100;
      const expected = expectedNextInfo(negative);
      const info = getNextGradeInfo(negative);
      expect(info).toEqual(expected);
      // sanity: next가 있으면 need는 next.minAmount - negative가 되어 양수
      if (info.next) {
        const nextMin = GRADE_MAP[info.next].minAmount;
        expect(info.need).toBe(nextMin - negative);
        expect(info.need! > 0).toBe(true);
      }
    });
  });
});
