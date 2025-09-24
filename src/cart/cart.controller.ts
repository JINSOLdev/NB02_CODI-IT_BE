import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { Cart, UserType } from '@prisma/client';
import { createOrUpdateCartItemsDto } from './cart.dto';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser } from 'src/auth/auth.types';
@Controller('api/cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Req() req: { user: AuthUser }): Promise<Cart> {
    const user = req.user;
    if (user.type !== UserType.BUYER) {
      throw new UnauthorizedException('do not buyer');
    }
    return this.cartService.createCart(user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch()
  async updateCartItem(
    @Req() req: { user: AuthUser },
    @Body() createOrUpdateCartItemsDto: createOrUpdateCartItemsDto,
  ): Promise<Cart> {
    const user = req.user;
    if (user.type !== UserType.BUYER) {
      throw new UnauthorizedException('do not buyer');
    }
    const updatedCart =
      await this.cartService.createOrUpdateCartItemAndReturnCart(
        user.userId,
        createOrUpdateCartItemsDto,
      );
    return updatedCart;
  }
}
