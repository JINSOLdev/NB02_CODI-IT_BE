import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { InquiryController } from './inquiry.controller';
import { InquiryService } from './inquiry.service';
import { InquiryRepository } from './inquiry.repository';

@Module({
  imports: [PrismaModule],
  controllers: [InquiryController],
  providers: [InquiryService, InquiryRepository],
})
export class InquiryModule { }
