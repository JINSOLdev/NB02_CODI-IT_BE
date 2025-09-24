import { Controller, Post, Body, Get, Patch, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { Cart } from '@prisma/client';
import { createOrUpdateCartItemInputDto } from './cart.dto';
import { AuthGuard } from '@nestjs/passport';

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
  async create(@Body('buyerId') buyerId: string): Promise<Cart> {
    return this.cartService.createCart(buyerId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch()
  updateCartItem(
    @Body() createOrUpdateCartItemInputDto: createOrUpdateCartItemInputDto,
    @Req() req: { user: AuthUser }
  ): Promise<Cart> {
    const user = req.user;
    const buyerId = user.id;
    const cartItems = await this.cartService.createOrUpdateCartItem(
      createOrUpdateCartItemInputDto,
      buyerId,
    );
    return cartItems;
  }
}
