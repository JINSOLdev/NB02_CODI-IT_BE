import { Module } from '@nestjs/common';
import { GradeService } from './grade.service';
import { GradeRepo } from './grade.repo';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [GradeService, GradeRepo, PrismaService],
  exports: [GradeService],
})
export class GradeModule {}
