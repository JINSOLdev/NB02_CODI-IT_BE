import { Module } from '@nestjs/common';
import { CartsController } from './carts.controller';
import { CartsService } from './carts.service';
import { CartsRepository } from './carts.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CartsController],
  providers: [CartsService, CartsRepository],
  exports: [CartsService],
})
export class CartsModule {}
