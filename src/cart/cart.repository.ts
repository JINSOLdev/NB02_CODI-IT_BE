import { BadRequestException, Injectable } from '@nestjs/common';
import { Cart, CartItem } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { createOrUpdateCartItemDto } from './cart.dto';

@Injectable()
export class CartRepository {
  constructor(private prisma: PrismaService) {}

  async getCartIdByBuyerId(buyerId: string): Promise<string> {
    try {
      const cart = await this.prisma.cart.findUnique({
        where: {
          buyerId,
        },
      });
      if (!cart) {
        throw new BadRequestException('장바구니를 찾을 수 없습니다');
      }
      return cart.id;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `장바구니 ID 조회 중 오류가 발생했습니다: ${error.message}`,
        );
      }
      throw new Error('장바구니 ID 조회 중 알 수 없는 오류가 발생했습니다');
    }
  }

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

  async createOrUpdateCartItem(
    createOrUpdateCartItemDto: createOrUpdateCartItemDto,
    cartId: string,
  ): Promise<CartItem> {
    try {
      const existingCartItem = await this.prisma.cartItem.findUnique({
        where: {
          cartId_productId_sizeId: {
            cartId,
            productId: createOrUpdateCartItemDto.productId,
            sizeId: createOrUpdateCartItemDto.sizeId,
          },
        },
      });
      if (existingCartItem) {
        return await this.prisma.cartItem.update({
          where: {
            cartId_productId_sizeId: {
              cartId,
              productId: createOrUpdateCartItemDto.productId,
              sizeId: createOrUpdateCartItemDto.sizeId,
            },
          },
          data: {
            quantity: createOrUpdateCartItemDto.quantity,
          },
        });
      }
      return await this.prisma.cartItem.create({
        data: {
          cartId,
          productId: createOrUpdateCartItemDto.productId,
          sizeId: createOrUpdateCartItemDto.sizeId,
          quantity: createOrUpdateCartItemDto.quantity,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `장바구니 업데이트 중 오류가 발생했습니다: ${error.message}`,
        );
      }
      throw new Error('장바구니 업데이트 중 알 수 없는 오류가 발생했습니다');
    }
  }
}
