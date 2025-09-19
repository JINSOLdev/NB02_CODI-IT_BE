import { Controller, Post, Body, Get } from '@nestjs/common';
import { CartsService } from './carts.service';
import { Cart } from '@prisma/client';

@Controller('carts')
export class CartsController {
  constructor(private cartService: CartsService) {}
  @Get()
  findAll(): object {
    return {
      message: 'ok',
    };
  }

  @Post()
  async create(@Body('userId') userId: string): Promise<Cart> {
    return this.cartService.createCart(userId);
  }
}
