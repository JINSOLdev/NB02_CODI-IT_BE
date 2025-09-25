import { BadRequestException, InternalServerErrorException, Injectable } from '@nestjs/common';
import { Cart } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { createOrUpdateCartItemsDto } from './cart.dto';

@Injectable()
export class CartRepository {
  constructor(private prisma: PrismaService) {}

  // buyerId로 장바구니 ID 조회
  async getCartIdByBuyerId(buyerId: string): Promise<Cart> {
    try {
      const cart = await this.prisma.cart.findUnique({
        where: {
          buyerId,
        },
      });
      if (!cart) {
        throw new BadRequestException('장바구니를 찾을 수 없습니다');
      }
      return cart;
    } catch (error) {
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          `장바구니 ID 조회 중 오류가 발생했습니다: ${error.message}`,
        );
      }
      throw new InternalServerErrorException(
        '장바구니 ID 조회 중 알 수 없는 오류가 발생했습니다',
      );
    }
  }

  // buyerId로 장바구니 생성
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
        throw new InternalServerErrorException(
          `장바구니 생성 중 오류가 발생했습니다: ${error.message}`,
        );
      }
      throw new InternalServerErrorException(
        '장바구니 생성 중 알 수 없는 오류가 발생했습니다',
      );
    }
  }

  // cartId와 productId, {sizeId, quantity}로 장바구니 아이템 업데이트
  async createOrUpdateCartItemAndReturnCart(
    cartId: string,
    createOrUpdateCartItemsDto: createOrUpdateCartItemsDto,
  ): Promise<Cart> {
    const sizes = createOrUpdateCartItemsDto.sizes;
    try {
      await this.prisma.$transaction(
        sizes.map((size) => {
          return this.prisma.cartItem.upsert({
            where: {
              cartId_productId_sizeId: {
                cartId,
                productId: createOrUpdateCartItemsDto.productId,
                sizeId: size.sizeId,
              },
            },
            create: {
              cartId,
              productId: createOrUpdateCartItemsDto.productId,
              sizeId: size.sizeId,
              quantity: size.quantity,
            },
            update: {
              quantity: size.quantity,
            },
          });
        }),
      );
      return await this.prisma.cart.findUniqueOrThrow({
        where: {
          id: cartId,
        },
        include: {
          items: true,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `장바구니 업데이트 중 오류가 발생했습니다: ${error.message}`,
        );
      }
      throw new InternalServerErrorException(
        '장바구니 업데이트 중 알 수 없는 오류가 발생했습니다',
      );
    }
  }
}
