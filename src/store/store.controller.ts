import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  Get,
  Param,
} from '@nestjs/common';
import type { Request } from 'express';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoreDetailDto } from './dto/store-detail.dto';
import { MockAuthGuard } from '../auth/mock-auth.guard';

@Controller('api/stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @UseGuards(MockAuthGuard)
  @Post()
  create(@Req() req: Request, @Body() dto: CreateStoreDto) {
    const user = req.user!;

    return this.storeService.create(user.id, user.role, dto);
  }

  @Get(':storeId')
  getStoreDetail(@Param('storeId') storeId: string): Promise<StoreDetailDto> {
    return this.storeService.getStoreDetail(storeId);
  }
}
