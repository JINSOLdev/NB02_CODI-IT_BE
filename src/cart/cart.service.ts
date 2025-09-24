import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Cart, CartItem } from '@prisma/client';
import { CartRepository } from './cart.repository';
import type { Request } from 'express';
import {
  createOrUpdateCartItemDto,
  createOrUpdateCartItemInputDto,
} from './cart.dto';
@Injectable()
export class CartService {
  constructor(private cartRepository: CartRepository) {}

  // 사용자의 장바구니를 생성하거나 이미 존재하는 장바구니를 반환
  async createCart(buyerId: string): Promise<Cart> {
    if (typeof buyerId !== 'string' || buyerId.trim() === '') {
      throw new BadRequestException('유효한 buyerId가 필요합니다');
    }
    try {
      const cart = await this.cartRepository.createOrGetCart(buyerId);
      return cart;
    } catch (error) {
      if (error instanceof Error && error.message.includes('database')) {
        throw new InternalServerErrorException(
          '데이터베이스 오류로 장바구니 생성에 실패했습니다',
        );
      }
      throw new BadRequestException(
        `장바구니 생성 실패: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async createOrUpdateCartItem(
    createOrUpdateCartItemInputDto: createOrUpdateCartItemInputDto,
    buyerId: string,
  ): Promise<CartItem[]> {
    const cartId = await this.cartRepository.getCartIdByBuyerId(buyerId);
    const sizes = createOrUpdateCartItemInputDto.sizes;
    const cartItems: CartItem[] = [];
    try {
      for (const size of sizes) {
        cartItems.push(
          await this.cartRepository.createOrUpdateCartItem(
            cartId,
            createOrUpdateCartItemInputDto.productId,
            size.sizeId,
            size.quantity,
          ),
        );
      }
      return cartItems;
    } catch (error) {
      if (error instanceof Error && error.message.includes('database')) {
        throw new InternalServerErrorException(
          '데이터베이스 오류로 장바구니 업데이트에 실패했습니다',
        );
      }
      throw new BadRequestException(
        `장바구니 업데이트 실패: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
