import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
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
    try {
      // 장바구니 업데이트
      const updatedCart =
        await this.cartRepository.createOrUpdateCartItemAndReturnCart(
          cart.id,
          createOrUpdateCartItemsDto,
        );
      return updatedCart;
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

  async getCartItem(userId: string, cartItemId: string) {
    const cartItem = await this.cartRepository.getCartItem(cartItemId);
    if (cartItem.cart.buyerId !== userId) {
      throw new BadRequestException('장바구니 아이템 조회 권한이 없습니다');
    }
    return cartItem;
  }
}
