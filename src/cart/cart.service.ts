import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CartRepository } from './cart.repository';
import { createOrUpdateCartItemsDto } from './cart.dto';
import { Logger } from '@nestjs/common';
@Injectable()
export class CartService {
  constructor(private cartRepository: CartRepository) {}

  private readonly logger = new Logger(CartService.name);

  // 사용자의 장바구니를 생성하거나 이미 존재하는 장바구니를 반환
  async createCart(buyerId: string) {
    if (typeof buyerId !== 'string' || buyerId.trim() === '') {
      this.logger.error('유효한 buyerId가 필요합니다');
      throw new BadRequestException('유효한 buyerId가 필요합니다');
    }
    const cart = await this.cartRepository.createOrGetCart(buyerId);
    if (!cart) {
      this.logger.error('장바구니 생성 실패');
      throw new BadRequestException('장바구니 생성 실패');
    }
    this.logger.log('장바구니 생성 성공');
    return cart;
  }

  async getCart(buyerId: string) {
    const cart = await this.cartRepository.getCartByBuyerId(buyerId);
    if (!cart) {
      this.logger.error(`장바구니 조회 실패 ${buyerId}`);
      return [];
    }
    this.logger.log(`장바구니 조회 성공 ${buyerId}`);
    return cart;
  }

  async createOrUpdateCartItemAndReturnCart(
    buyerId: string,
    createOrUpdateCartItemsDto: createOrUpdateCartItemsDto,
  ) {
    const cart = await this.cartRepository.getCartIdByBuyerId(buyerId);
    if (!cart) {
      this.logger.error('장바구니를 찾을 수 없습니다');
      throw new BadRequestException('장바구니를 찾을 수 없습니다');
    }
    // 장바구니 업데이트
    const updatedCart =
      await this.cartRepository.createOrUpdateCartItemAndReturnCart(
        cart.id,
        createOrUpdateCartItemsDto,
      );
    if (!updatedCart) {
      this.logger.error('장바구니 업데이트 실패');
      throw new BadRequestException('장바구니 업데이트 실패');
    }
    this.logger.log('장바구니 업데이트 성공');
    return updatedCart;
  }

  async getCartItem(userId: string, cartItemId: string) {
    const cartItem = await this.cartRepository.getCartItem(cartItemId);
    if (!cartItem) {
      this.logger.error('장바구니 아이템 조회 실패');
      throw new NotFoundException('장바구니 아이템을 찾을 수 없습니다');
    }
    if (cartItem.cart.buyerId !== userId) {
      this.logger.error('장바구니 아이템 조회 권한이 없습니다');
      throw new ForbiddenException('장바구니 아이템 조회 권한이 없습니다');
    }
    this.logger.log('장바구니 아이템 조회 성공');
    return cartItem;
  }

  async deleteCartItem(userId: string, cartItemId: string) {
    const cartItem = await this.cartRepository.getCartItem(cartItemId);
    if (!cartItem) {
      this.logger.error('장바구니 아이템 삭제 실패');
      throw new NotFoundException('장바구니 아이템을 찾을 수 없습니다');
    }
    if (cartItem.cart.buyerId !== userId) {
      this.logger.error('장바구니 아이템 삭제 권한이 없습니다');
      throw new ForbiddenException('장바구니 아이템 삭제 권한이 없습니다');
    }
    this.logger.log('장바구니 아이템 삭제 성공');
    return this.cartRepository.deleteCartItem(cartItemId);
  }
}
