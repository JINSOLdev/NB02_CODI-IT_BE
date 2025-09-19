import { Injectable } from '@nestjs/common';
import { Cart } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartsRepository {
  constructor(private prisma: PrismaService) {}

  async createOrGetCart(userId: string): Promise<Cart> {
    try {
      const existingCart = await this.prisma.cart.findUnique({
        where: {
          userId,
        },
      });
      if (existingCart) {
        return existingCart;
      }
      return await this.prisma.cart.create({
        data: {
          userId,
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
