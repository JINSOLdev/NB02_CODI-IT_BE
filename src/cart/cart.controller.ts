import { Controller, Post, Body, Get } from '@nestjs/common';
import { CartService } from './cart.service';
import { Cart } from '@prisma/client';

@Controller('api/cart')
export class CartController {
  constructor(private cartService: CartService) {}
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
