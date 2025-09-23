import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Cart } from '@prisma/client';
import { CartRepository } from './cart.repository';

@Injectable()
export class CartService {
  constructor(private cartRepository: CartRepository) {}

  // 사용자의 장바구니를 생성하거나 이미 존재하는 장바구니를 반환
  async createCart(userId: string): Promise<Cart> {
    if (typeof userId !== 'string' || userId.trim() === '') {
      throw new BadRequestException('유효한 사용자 ID가 필요합니다');
    }
    try {
      const cart = await this.cartRepository.createOrGetCart(userId);
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
}
