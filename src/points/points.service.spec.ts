import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PointsService } from './points.service';
import { PointsRepository } from './points.repository';
import { GradeService } from 'src/grades/grade.service';
import { OrderStatus } from '@prisma/client';
import { REASON } from './points.types';

describe('PointsService', () => {
  let service: PointsService;
  let repo: {
    prismaSvc: { $transaction: <T>(fn: (tx: any) => Promise<T>) => Promise<T> };
    getUserBasic: jest.Mock;
    hasPointLog: jest.Mock;
    decUserPointsIfEnough: jest.Mock;
    createPointLog: jest.Mock;
    getOrder: jest.Mock;
    incUserPoints: jest.Mock;
    getEarnedDelta: jest.Mock;
  };
  let grade: {
    getCurrentGrade: jest.Mock;
    getEarnRate: jest.Mock;
    getNextGradeInfo: jest.Mock;
    syncUserGrade: jest.Mock;
  };

  // 트랜잭션 시뮬레이션
  const tx = { _tx: true };
  const runTx = async <T>(fn: (t: any) => Promise<T>) => fn(tx);

  beforeEach(async () => {
    repo = {
      prismaSvc: { $transaction: jest.fn(runTx) },
      getUserBasic: jest.fn(),
      hasPointLog: jest.fn(),
      decUserPointsIfEnough: jest.fn(),
      createPointLog: jest.fn(),
      getOrder: jest.fn(),
      incUserPoints: jest.fn(),
      getEarnedDelta: jest.fn(),
    };

    grade = {
      getCurrentGrade: jest.fn(),
      getEarnRate: jest.fn(),
      getNextGradeInfo: jest.fn(),
      syncUserGrade: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointsService,
        { provide: PointsRepository, useValue: repo },
        { provide: GradeService, useValue: grade },
      ],
    }).compile();

    service = module.get(PointsService);
  });

  describe('getMyPointSummary', () => {
    it('유저가 없으면 BadRequestException', async () => {
      repo.getUserBasic.mockResolvedValue(null);
      await expect(service.getMyPointSummary('nope')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('유저/등급/다음등급 정보를 묶어서 반환', async () => {
      repo.getUserBasic.mockResolvedValue({ id: 'u1', points: 1234 });
      grade.getCurrentGrade.mockResolvedValue({
        lifetime: 50000,
        grade: 'GREEN',
      });
      grade.getEarnRate.mockReturnValue(0.01);
      grade.getNextGradeInfo.mockReturnValue({ next: 'ORANGE', need: 50000 });

      const res = await service.getMyPointSummary('u1');
      expect(res).toEqual({
        points: 1234,
        gradeLevel: 'GREEN',
        lifetimePurchase: 50000,
        earnRate: 0.01,
        nextGrade: 'ORANGE',
        needToNext: 50000,
      });
      expect(repo.getUserBasic).toHaveBeenCalledWith('u1');
      expect(grade.getCurrentGrade).toHaveBeenCalledWith('u1');
      expect(grade.getEarnRate).toHaveBeenCalledWith('GREEN');
      expect(grade.getNextGradeInfo).toHaveBeenCalledWith(50000);
    });
  });

  describe('spendPointsForOrder', () => {
    it('amount가 0 이하이면 아무 것도 하지 않음', async () => {
      await service.spendPointsForOrder('u1', 'o1', 0);
      expect(repo.prismaSvc.$transaction).not.toHaveBeenCalled();
    });

    it('이미 SPEND_ORDER 로그가 있으면 스킵', async () => {
      repo.hasPointLog.mockResolvedValue(true);
      await service.spendPointsForOrder('u1', 'o1', 100);
      expect(repo.hasPointLog).toHaveBeenCalledWith(
        'u1',
        'o1',
        REASON.SPEND_ORDER,
        tx,
      );
      expect(repo.decUserPointsIfEnough).not.toHaveBeenCalled();
    });

    it('포인트 부족하면 BadRequestException', async () => {
      repo.hasPointLog.mockResolvedValue(false);
      repo.decUserPointsIfEnough.mockResolvedValue(false);

      await expect(
        service.spendPointsForOrder('u1', 'o1', 1000),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(repo.decUserPointsIfEnough).toHaveBeenCalledWith('u1', 1000, tx);
      expect(repo.createPointLog).not.toHaveBeenCalled();
    });

    it('성공 시 차감 및 로그 생성', async () => {
      repo.hasPointLog.mockResolvedValue(false);
      repo.decUserPointsIfEnough.mockResolvedValue(true);

      await service.spendPointsForOrder('u1', 'o1', 300);

      expect(repo.decUserPointsIfEnough).toHaveBeenCalledWith('u1', 300, tx);
      expect(repo.createPointLog).toHaveBeenCalledWith(
        'u1',
        'o1',
        -300,
        REASON.SPEND_ORDER,
        tx,
      );
    });
  });

  describe('earnPointsOnPaidOrder', () => {
    it('주문이 없으면 BadRequestException', async () => {
      repo.getOrder.mockResolvedValue(null);
      await expect(service.earnPointsOnPaidOrder('oX')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('주문 상태가 COMPLETEDPAYMENT가 아니면 아무 것도 하지 않음', async () => {
      repo.getOrder.mockResolvedValue({
        id: 'o1',
        userId: 'u1',
        status: OrderStatus.PROCESSING,
        totalPrice: 10000,
      });

      await service.earnPointsOnPaidOrder('o1');
      expect(repo.hasPointLog).not.toHaveBeenCalled();
      expect(repo.incUserPoints).not.toHaveBeenCalled();
      expect(grade.syncUserGrade).not.toHaveBeenCalled();
    });

    it('이미 적립 로그가 있으면 스킵', async () => {
      repo.getOrder.mockResolvedValue({
        id: 'o1',
        userId: 'u1',
        status: OrderStatus.COMPLETEDPAYMENT,
        totalPrice: 10000,
      });
      repo.hasPointLog.mockResolvedValue(true);

      await service.earnPointsOnPaidOrder('o1');
      expect(repo.incUserPoints).not.toHaveBeenCalled();
      expect(repo.createPointLog).not.toHaveBeenCalled();
    });

    it('적립률로 earn을 계산하여 적립/로그 및 등급 동기화', async () => {
      repo.getOrder.mockResolvedValue({
        id: 'o1',
        userId: 'u1',
        status: OrderStatus.COMPLETEDPAYMENT,
        totalPrice: 12345, // earn = floor(12345 * 0.02) = 246
      });
      repo.hasPointLog.mockResolvedValue(false);
      grade.getCurrentGrade
        // 지금 처리 중인 주문 제외
        .mockResolvedValueOnce({ grade: 'GREEN' })
        // 적립 후 표시용 등급 캐시 동기화용
        .mockResolvedValueOnce({ grade: 'ORANGE' });

      grade.getEarnRate.mockReturnValue(0.02);

      await service.earnPointsOnPaidOrder('o1');

      expect(grade.getCurrentGrade).toHaveBeenNthCalledWith(1, 'u1', tx, 'o1');
      expect(grade.getEarnRate).toHaveBeenCalledWith('GREEN');
      expect(repo.incUserPoints).toHaveBeenCalledWith('u1', 246, tx);
      expect(repo.createPointLog).toHaveBeenCalledWith(
        'u1',
        'o1',
        246,
        REASON.EARN_PURCHASE,
        tx,
      );
      expect(grade.syncUserGrade).toHaveBeenCalledWith('u1', 'ORANGE', tx);
    });

    it('earn이 0 이하면 적립/로그 생략하고 등급 동기화만 수행', async () => {
      repo.getOrder.mockResolvedValue({
        id: 'o1',
        userId: 'u1',
        status: OrderStatus.COMPLETEDPAYMENT,
        totalPrice: -100,
      });
      repo.hasPointLog.mockResolvedValue(false);
      grade.getCurrentGrade
        .mockResolvedValueOnce({ grade: 'GREEN' })
        .mockResolvedValueOnce({ grade: 'GREEN' });
      grade.getEarnRate.mockReturnValue(0.01);

      await service.earnPointsOnPaidOrder('o1');

      expect(repo.incUserPoints).not.toHaveBeenCalled();
      expect(repo.createPointLog).not.toHaveBeenCalled();
      expect(grade.syncUserGrade).toHaveBeenCalledWith('u1', 'GREEN', tx);
    });
  });

  describe('revertOnCancel', () => {
    it('주문이 없으면 조용히 종료', async () => {
      repo.getOrder.mockResolvedValue(null);
      await service.revertOnCancel('oX');
      expect(repo.hasPointLog).not.toHaveBeenCalled();
      expect(grade.syncUserGrade).not.toHaveBeenCalled();
    });

    it('이미 REVERT_CANCEL 로그가 있으면 회수는 건너뛰고 등급 동기화만', async () => {
      repo.getOrder.mockResolvedValue({ id: 'o1', userId: 'u1' });
      repo.hasPointLog.mockResolvedValue(true);
      grade.getCurrentGrade.mockResolvedValue({ grade: 'GREEN' });

      await service.revertOnCancel('o1');

      expect(repo.getEarnedDelta).not.toHaveBeenCalled();
      expect(grade.syncUserGrade).toHaveBeenCalledWith('u1', 'GREEN', tx);
    });

    it('적립 회수 대상이 있으면 차감 및 회수 로그 생성', async () => {
      repo.getOrder.mockResolvedValue({ id: 'o1', userId: 'u1' });
      repo.hasPointLog.mockResolvedValue(false);
      repo.getEarnedDelta.mockResolvedValue(150);
      repo.decUserPointsIfEnough.mockResolvedValue(true);
      grade.getCurrentGrade.mockResolvedValue({ grade: 'ORANGE' });

      await service.revertOnCancel('o1');

      expect(repo.decUserPointsIfEnough).toHaveBeenCalledWith('u1', 150, tx);
      expect(repo.createPointLog).toHaveBeenCalledWith(
        'u1',
        'o1',
        -150,
        REASON.REVERT_CANCEL,
        tx,
      );
      expect(grade.syncUserGrade).toHaveBeenCalledWith('u1', 'ORANGE', tx);
    });

    it('회수할 포인트가 부족하면 BadRequestException', async () => {
      repo.getOrder.mockResolvedValue({ id: 'o1', userId: 'u1' });
      repo.hasPointLog.mockResolvedValue(false);
      repo.getEarnedDelta.mockResolvedValue(200);
      repo.decUserPointsIfEnough.mockResolvedValue(false);

      await expect(service.revertOnCancel('o1')).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(repo.createPointLog).not.toHaveBeenCalled();
    });

    it('earnedDelta가 0 이하이면 회수 스킵하고 등급만 동기화', async () => {
      repo.getOrder.mockResolvedValue({ id: 'o1', userId: 'u1' });
      repo.hasPointLog.mockResolvedValue(false);
      repo.getEarnedDelta.mockResolvedValue(0);
      grade.getCurrentGrade.mockResolvedValue({ grade: 'GREEN' });

      await service.revertOnCancel('o1');

      expect(repo.decUserPointsIfEnough).not.toHaveBeenCalled();
      expect(repo.createPointLog).not.toHaveBeenCalled();
      expect(grade.syncUserGrade).toHaveBeenCalledWith('u1', 'GREEN', tx);
    });
  });
});
