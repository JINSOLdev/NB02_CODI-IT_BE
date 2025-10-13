import { Injectable } from '@nestjs/common';
import { GradeLevel } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { COUNTED_ORDER_STATUS, REASON } from './points.types';
import { TxLike } from 'src/common/prisma-tx.type';

@Injectable()
export class PointsRepossitory {
  constructor(private readonly prisma: PrismaService) {}

  get prismaSvc() {
    return this.prisma;
  }

  // 기본 조회
  async getUserBasic(userId: string, tx: TxLike = this.prisma) {
    return tx.user.findUnique({
      where: { id: userId },
      select: { points: true, gradeLevel: true },
    });
  }

  // 등급 산정을 위한 누적 합계
  async sumLifetime(
    userId: string,
    tx: TxLike = this.prisma,
    excludeOrderId?: string,
  ) {
    const agg = await tx.order.aggregate({
      where: {
        userId,
        status: { in: COUNTED_ORDER_STATUS },
        ...(excludeOrderId ? { NOT: { id: excludeOrderId } } : {}),
      },
      _sum: { totalPrice: true },
    });
    return agg._sum.totalPrice ?? 0;
  }

  // 주문/포인트 트랜잭션 관련
  async getOrder(orderId: string, tx: TxLike = this.prisma) {
    return tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, totalPrice: true, status: true },
    });
  }

  // 지금 처리 중인 주문 사유에 대한 포인트 트랜잭션 존재 여부
  // 중복 적립/중복 차감 방지
  async hasPointLog(
    userId: string,
    orderId: string,
    reason: string,
    tx: TxLike = this.prisma,
  ) {
    const found = await tx.pointTransaction.findFirst({
      where: { userId, orderId, reason },
      select: { id: true },
    });
    return !!found;
  }

  // 사용자 포인트 차감(보유 충분 시)
  async decUserPointsIfEnough(userId: string, amount: number, tx: TxLike) {
    const res = await tx.user.updateMany({
      where: { id: userId, points: { gte: amount } },
      data: { points: { decrement: amount } },
    });
    return res.count > 0;
  }

  // 사용자 포인트 증가(적립/환급)
  async incUserPoints(userId: string, amount: number, tx: TxLike) {
    await tx.user.update({
      where: { id: userId },
      data: { points: { increment: amount } },
    });
  }

  // 포인트 트랜잭션 기록
  async createPointLog(
    userId: string,
    orderId: string,
    delta: number,
    reason: string,
    tx: TxLike,
  ) {
    await tx.pointTransaction.create({
      data: { userId, orderId, delta, reason },
    });
  }

  // 사용자 등급 동기화
  async syncUserGrade(userId: string, newGrade: GradeLevel, tx: TxLike) {
    await tx.user.update({
      where: { id: userId },
      data: { gradeLevel: newGrade },
    });
  }

  // 지금 처리 중인 주문에 대해 적립된 포인트 조회(환급 시 필요)
  async getEarnedDelta(userId: string, orderId: string, tx: TxLike) {
    const earned = await tx.pointTransaction.findFirst({
      where: { userId, orderId, reason: REASON.EARN_PURCHASE },
      select: { delta: true },
    });
    return earned?.delta ?? 0;
  }
}
