import { Injectable } from '@nestjs/common';
import { GradeLevel, OrderStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { TxLike } from 'src/common/prisma-tx.type';

@Injectable()
export class GradeRepository {
  constructor(private readonly prisma: PrismaService) {}

  get prismaSvc() {
    return this.prisma;
  }

  // 등급 산정을 위한 누적 합계
  async sumLifetime(
    userId: string,
    tx: TxLike = this.prisma,
    thisOrderIdToExclude?: string,
  ): Promise<number> {
    const agg = await tx.order.aggregate({
      where: {
        userId,
        status: OrderStatus.COMPLETEDPAYMENT,
        ...(thisOrderIdToExclude ? { NOT: { id: thisOrderIdToExclude } } : {}),
      },
      _sum: { totalPrice: true },
    });
    return agg._sum.totalPrice ?? 0;
  }

  // 사용자 등급 저장(표시용 캐시)
  async saveUserGrade(
    userId: string,
    level: GradeLevel,
    tx: TxLike,
  ): Promise<void> {
    await tx.user.update({
      where: { id: userId },
      data: { gradeLevel: level },
    });
  }
}
