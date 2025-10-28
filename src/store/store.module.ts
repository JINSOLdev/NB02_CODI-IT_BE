import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { StoreRepository } from './store.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from 'src/s3/s3.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [StoreService, StoreRepository, S3Service],
  controllers: [StoreController],
})
export class StoreModule {}
