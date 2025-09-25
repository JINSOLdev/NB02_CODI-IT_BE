import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ReviewRepository } from './review.repository';
import { ReviewService } from './review.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReviewController],
  providers: [ReviewService, ReviewRepository],
})
export class ReviewModule { }
