import {
  Controller,
  Post,
  Body,
  Patch,
  UseGuards,
  Req,
  UnauthorizedException,
  Get,
  Param,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { Cart, UserType, CartItem } from '@prisma/client';
import { createOrUpdateCartItemsDto } from './cart.dto';
import { AuthUser } from 'src/auth/auth.types';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
@Controller('api/cart')
export class CartController {
  constructor(private cartService: CartService) {}

  //사용자의 장바구니를 생성합니다. 이미 존재하는 경우 해당 장바구니를 반환합니다.
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req: { user: AuthUser }): Promise<Cart> {
    const user = req.user;
    if (user.type !== UserType.BUYER) {
      throw new UnauthorizedException('do not buyer');
    }
    return this.cartService.createCart(user.userId);
  }

  //장바구니에서 특정 아이템의 상세 정보를 조회합니다.
  @UseGuards(JwtAuthGuard)
  @Get(':cartItemId')
  async getCartItem(
    @Req() req: { user: AuthUser },
    @Param('cartItemId') cartItemId: string,
  ): Promise<CartItem> {
    const user = req.user;
    if (user.type !== UserType.BUYER) {
      throw new UnauthorizedException('구매자만 접근 가능합니다');
    }
    return this.cartService.getCartItem(user.userId, cartItemId);
  }

  //사용자의 장바구니를 조회합니다. 장바구니가 없으면 빈 배열을 반환합니다.
  @UseGuards(JwtAuthGuard)
  @Get()
  async getCart(@Req() req: { user: AuthUser }): Promise<Cart> {
    const user = req.user;
    if (user.type !== UserType.BUYER) {
      throw new UnauthorizedException('구매자만 접근 가능합니다');
    }
    return this.cartService.getCart(user.userId);
  }

  //사용자의 장바구니를 업데이트합니다.
  @UseGuards(JwtAuthGuard)
  @Patch()
  async updateCartItem(
    @Req() req: { user: AuthUser },
    @Body() createOrUpdateCartItemsDto: createOrUpdateCartItemsDto,
  ): Promise<Cart> {
    const user = req.user;
    if (user.type !== UserType.BUYER) {
      throw new UnauthorizedException('구매자만 접근 가능합니다');
    }
    const updatedCart =
      await this.cartService.createOrUpdateCartItemAndReturnCart(
        user.userId,
        createOrUpdateCartItemsDto,
      );
    return updatedCart;
  }

}
