import {
  Controller,
  Post,
  Body,
  Patch,
  UseGuards,
  Req,
  Get,
  Param,
  Delete,
  Logger,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { Cart, CartItem } from '@prisma/client';
import { createOrUpdateCartItemsDto } from './cart.dto';
import { AuthUser } from 'src/auth/auth.types';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { BuyerGuard } from 'src/common/guard/buyer.guard';
import { ApiOperation, ApiBody, ApiHeader, ApiResponse } from '@nestjs/swagger';
@Controller('api/cart')
export class CartController {
  private readonly logger = new Logger(CartController.name);

  constructor(private cartService: CartService) {}

  //사용자의 장바구니를 생성합니다. 이미 존재하는 경우 해당 장바구니를 반환합니다.
  @UseGuards(JwtAuthGuard, BuyerGuard)
  @ApiOperation({ summary: '장바구니 생성' })
  @ApiHeader({
    name: 'Authorization',
    description: 'JWT 토큰',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: '장바구니 생성 성공',
  })
  @ApiResponse({
    status: 400,
    description: '장바구니 생성 실패',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @Post()
  async create(@Req() req: { user: AuthUser }): Promise<Cart> {
    const user = req.user;
    return this.cartService.createCart(user.userId);
  }

  //장바구니에서 특정 아이템의 상세 정보를 조회합니다.
  @UseGuards(JwtAuthGuard, BuyerGuard)
  @ApiOperation({ summary: '장바구니 아이템 조회' })
  @ApiHeader({
    name: 'Authorization',
    description: 'JWT 토큰',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '장바구니 아이템 조회 성공',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 404,
    description: '장바구니 아이템 조회 실패',
  })
  @Get(':cartItemId')
  async getCartItem(
    @Req() req: { user: AuthUser },
    @Param('cartItemId') cartItemId: string,
  ): Promise<CartItem> {
    const user = req.user;
    return this.cartService.getCartItem(user.userId, cartItemId);
  }

  //사용자의 장바구니를 조회합니다. 장바구니가 없으면 빈 배열을 반환합니다.
  @UseGuards(JwtAuthGuard, BuyerGuard)
  @ApiOperation({ summary: '장바구니 조회' })
  @ApiHeader({
    name: 'Authorization',
    description: 'JWT 토큰',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '장바구니 조회 성공',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @Get()
  async getCart(@Req() req: { user: AuthUser }) {
    const user = req.user;
    const cart = await this.cartService.getCart(user.userId);
    return cart;
  }

  //사용자의 장바구니를 업데이트합니다.
  @UseGuards(JwtAuthGuard, BuyerGuard)
  @ApiOperation({ summary: '장바구니 업데이트' })
  @ApiHeader({
    name: 'Authorization',
    description: 'JWT 토큰',
    required: true,
  })
  @ApiBody({
    description: '장바구니 업데이트',
    required: true,
    type: createOrUpdateCartItemsDto,
  })
  @ApiResponse({
    status: 200,
    description: '장바구니 업데이트 성공',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @Patch()
  async updateCartItem(
    @Req() req: { user: AuthUser },
    @Body() createOrUpdateCartItemsDto: createOrUpdateCartItemsDto,
  ): Promise<Cart> {
    const user = req.user;
    const updatedCart =
      await this.cartService.createOrUpdateCartItemAndReturnCart(
        user.userId,
        createOrUpdateCartItemsDto,
      );
    return updatedCart;
  }

  @UseGuards(JwtAuthGuard, BuyerGuard)
  @ApiOperation({ summary: '장바구니 아이템 삭제' })
  @ApiHeader({
    name: 'Authorization',
    description: 'JWT 토큰',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '장바구니 아이템 삭제 성공',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 404,
    description: '장바구니 아이템 삭제 실패',
  })
  @Delete(':cartItemId')
  async deleteCartItem(
    @Req() req: { user: AuthUser },
    @Param('cartItemId') cartItemId: string,
  ) {
    const user = req.user;
    const deletedCartItem = await this.cartService.deleteCartItem(
      user.userId,
      cartItemId,
    );
    return deletedCartItem;
  }
}
