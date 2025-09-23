import { Injectable } from '@nestjs/common';
import { Cart } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartRepository {
  constructor(private prisma: PrismaService) {}

  async createOrGetCart(buyerId: string): Promise<Cart> {
    try {
      const existingCart = await this.prisma.cart.findUnique({
        where: {
          buyerId,
        },
      });
      if (existingCart) {
        return existingCart;
      }
      return await this.prisma.cart.create({
        data: {
          buyerId,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `장바구니 생성 중 오류가 발생했습니다: ${error.message}`,
        );
      }
      throw new Error('장바구니 생성 중 알 수 없는 오류가 발생했습니다');
    }
  }
}
