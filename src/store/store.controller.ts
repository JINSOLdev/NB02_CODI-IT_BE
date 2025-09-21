import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { MockAuthGuard } from '../auth/mock-auth.guard';

type Role = 'SELLER' | 'BUYER';
interface AuthUser {
  id: string;
  role: Role;
}

@Controller('api/stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @UseGuards(MockAuthGuard)
  @Post()
  create(@Req() req: Request, @Body() dto: CreateStoreDto) {
    const user = req.user as AuthUser | undefined;
    if (!user) {
      return this.storeService.create('seller_demo', 'SELLER', dto);
    }
    return this.storeService.create(user.id, user.role, dto);
  }
}
