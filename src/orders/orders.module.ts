import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [], // 주문은 현재 외부 모듈을 직접 import할 필요 없음
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService],
  exports: [OrdersService], // 다른 모듈에서 주문 접근 시 사용 가능
})
export class OrdersModule {}
