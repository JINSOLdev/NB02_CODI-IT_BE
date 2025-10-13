import { Module } from '@nestjs/common';
import { GradeService } from './grade.service';
import { GradeRepository } from './grade.repository';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [GradeService, GradeRepository, PrismaService],
  exports: [GradeService],
})
export class GradeModule {}
