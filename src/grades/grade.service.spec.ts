import { Test, TestingModule } from '@nestjs/testing';
import { GradeService } from './grade.service';
import { GradeRepository } from './grade.repository';
import { GradeLevel } from '@prisma/client';
import type { TxLike } from 'src/common/prisma-tx.type';
import * as gradeUtil from './grade.util';

describe('GradeService', () => {
  let service: GradeService;

  // Repository Mock
  const tx: TxLike = { _tx: true } as unknown as TxLike;
  const repoMock = {
    prismaSvc: { _prisma: true },
    sumLifetime: jest.fn<Promise<number>, [string, TxLike, string?]>(),
    saveUserGrade: jest.fn<Promise<void>, [string, GradeLevel, TxLike]>(),
  };

  // --- Utils: 안전한 제네릭 타입으로 Spy 선언 (any 사용 금지) ---
  const getEarnRateSpy: jest.SpyInstance<
    ReturnType<typeof gradeUtil.getEarnRate>,
    Parameters<typeof gradeUtil.getEarnRate>
  > = jest.spyOn(gradeUtil, 'getEarnRate');

  const getGradeByAmountSpy: jest.SpyInstance<
    ReturnType<typeof gradeUtil.getGradeByAmount>,
    Parameters<typeof gradeUtil.getGradeByAmount>
  > = jest.spyOn(gradeUtil, 'getGradeByAmount');

  const getNextGradeInfoSpy: jest.SpyInstance<
    ReturnType<typeof gradeUtil.getNextGradeInfo>,
    Parameters<typeof gradeUtil.getNextGradeInfo>
  > = jest.spyOn(gradeUtil, 'getNextGradeInfo');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradeService,
        { provide: GradeRepository, useValue: repoMock },
      ],
    }).compile();

    service = module.get(GradeService);

    // repo/spy 초기화 (재할당 없이 reset만)
    jest.clearAllMocks();
    getEarnRateSpy.mockReset();
    getGradeByAmountSpy.mockReset();
    getNextGradeInfoSpy.mockReset();
  });

  describe('getCurrentGrade', () => {
    it('repo.prismaSvc 기본 tx를 사용하고, getGradeByAmount로 등급을 계산한다', async () => {
      const userId = 'u1';
      const lifetime = 123_456;

      repoMock.sumLifetime.mockResolvedValueOnce(lifetime);
      getGradeByAmountSpy.mockReturnValueOnce(GradeLevel.ORANGE);

      const result = await service.getCurrentGrade(userId); // tx/제외주문 생략

      expect(repoMock.sumLifetime).toHaveBeenCalledWith(
        userId,
        repoMock.prismaSvc, // 기본값 사용
        undefined,
      );
      expect(getGradeByAmountSpy).toHaveBeenCalledWith(lifetime);
      expect(result).toEqual({ lifetime, grade: GradeLevel.ORANGE });
    });

    it('명시한 tx와 excludeOrderId를 그대로 전달한다', async () => {
      const userId = 'u2';
      const excludeOrderId = 'order_999';
      const lifetime = 50_000;

      repoMock.sumLifetime.mockResolvedValueOnce(lifetime);
      getGradeByAmountSpy.mockReturnValueOnce(GradeLevel.GREEN);

      const result = await service.getCurrentGrade(userId, tx, excludeOrderId);

      expect(repoMock.sumLifetime).toHaveBeenCalledWith(
        userId,
        tx,
        excludeOrderId,
      );
      expect(result).toEqual({ lifetime, grade: GradeLevel.GREEN });
    });
  });

  describe('getEarnRate', () => {
    it('유틸 getEarnRate에 위임해 같은 값을 반환한다', () => {
      getEarnRateSpy.mockReturnValueOnce(0.02);

      const rate = service.getEarnRate(GradeLevel.GREEN);

      expect(getEarnRateSpy).toHaveBeenCalledWith(GradeLevel.GREEN);
      expect(rate).toBe(0.02);
    });
  });

  describe('getNextGradeInfo', () => {
    it('유틸 getNextGradeInfo에 위임해 같은 객체를 반환한다', () => {
      getNextGradeInfoSpy.mockReturnValueOnce({
        next: GradeLevel.ORANGE,
        need: 50_000,
      });

      const info = service.getNextGradeInfo(10_000);

      expect(getNextGradeInfoSpy).toHaveBeenCalledWith(10_000);
      expect(info).toEqual({ next: GradeLevel.ORANGE, need: 50_000 });
    });
  });

  describe('syncUserGrade', () => {
    it('repo.saveUserGrade를 호출한다', async () => {
      const userId = 'u3';
      const level = GradeLevel.BLACK;

      await service.syncUserGrade(userId, level, tx);

      expect(repoMock.saveUserGrade).toHaveBeenCalledWith(userId, level, tx);
    });
  });
});
