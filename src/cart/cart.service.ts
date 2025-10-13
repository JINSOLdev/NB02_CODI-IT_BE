import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CartRepository } from './cart.repository';
import { createOrUpdateCartItemsDto } from './cart.dto';
@Injectable()
export class CartService {
  constructor(private cartRepository: CartRepository) {}

  // 사용자의 장바구니를 생성하거나 이미 존재하는 장바구니를 반환
  async createCart(buyerId: string) {
    if (typeof buyerId !== 'string' || buyerId.trim() === '') {
      throw new BadRequestException('유효한 buyerId가 필요합니다');
    }
    const cart = await this.cartRepository.createOrGetCart(buyerId);
    if (!cart) {
      throw new BadRequestException('장바구니 생성 실패');
    }
    return cart;
  }

  async getCart(buyerId: string) {
    const cart = await this.cartRepository.getCartByBuyerId(buyerId);
    if (!cart) {
      return [];
    }
    return cart;
  }

  async createOrUpdateCartItemAndReturnCart(
    buyerId: string,
    createOrUpdateCartItemsDto: createOrUpdateCartItemsDto,
  ) {
    const cart = await this.cartRepository.getCartIdByBuyerId(buyerId);
    // 장바구니 업데이트
    const updatedCart =
      await this.cartRepository.createOrUpdateCartItemAndReturnCart(
        cart.id,
        createOrUpdateCartItemsDto,
      );
    if (!updatedCart) {
      throw new BadRequestException('장바구니 업데이트 실패');
    }
    return updatedCart;
  }

  async getCartItem(userId: string, cartItemId: string) {
    const cartItem = await this.cartRepository.getCartItem(cartItemId);
    if (!cartItem) {
      throw new NotFoundException('장바구니 아이템을 찾을 수 없습니다');
    }
    if (cartItem.cart.buyerId !== userId) {
      throw new ForbiddenException('장바구니 아이템 조회 권한이 없습니다');
    }
    return cartItem;
  }

  async deleteCartItem(userId: string, cartItemId: string) {
    const cartItem = await this.cartRepository.getCartItem(cartItemId);
    if (!cartItem) {
      throw new NotFoundException('장바구니 아이템을 찾을 수 없습니다');
    }
    if (cartItem.cart.buyerId !== userId) {
      throw new ForbiddenException('장바구니 아이템 삭제 권한이 없습니다');
    }
    return this.cartRepository.deleteCartItem(cartItemId);
  }
}
