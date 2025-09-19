import { Injectable, BadRequestException } from '@nestjs/common';
import { Cart } from '@prisma/client';
import { CartsRepository } from './carts.repository';

@Injectable()
export class CartsService {
  constructor(private cartsRepository: CartsRepository) {}

  async createCart(userId: string): Promise<Cart> {
    if (!userId) {
      throw new BadRequestException('사용자 ID가 필요합니다');
    }
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new BadRequestException('유효한 사용자 ID가 필요합니다');
    }
    const userCart = await this.cartsRepository.getCartByUserId(userId);
    if (userCart) {
      return userCart;
    }
    try {
      const cart = await this.cartsRepository.createCart(userId);
      return cart;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(`장바구니 생성 실패: ${error.message}`);
      } else {
        throw new BadRequestException(
          '장바구니 생성 중 알 수 없는 오류가 발생했습니다',
        );
      }
    }
  }
}
