import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { PrismaService } from '../prisma/prisma.service';
import { PointsModule } from '../points/points.module';

@Module({
  imports: [PointsModule], // ✅ PointsService 사용을 위해 PointsModule 추가
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository, PrismaService],
  exports: [OrdersService],
})
export class OrdersModule {}
