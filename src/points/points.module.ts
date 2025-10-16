import { Module } from '@nestjs/common';
import { PointsService } from './points.service';
import { PointsRepository } from './points.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { GradeModule } from 'src/grades/grade.module';
import { PointsController } from './points.controller';

@Module({
  imports: [GradeModule],
  controllers: [PointsController],
  providers: [PointsService, PointsRepository, PrismaService],
  exports: [PointsService],
})
export class PointsModule {}
