import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CartRepository {
  constructor(private prisma: PrismaService) {}

  // buyerId로 장바구니 생성
  async createOrGetCart(buyerId: string) {
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
  }

  // buyerId로 장바구니 조회
  async getCartByBuyerId(buyerId: string, tx?: Prisma.TransactionClient) {
    const prisma = tx || this.prisma;
    const cart = await prisma.cart.findUnique({
      where: {
        buyerId,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                store: true,
              },
            },
            size: true,
          },
        },
      },
    });
    return cart;
  }

  //장바구니 아이템 업데이트
  upsertCartItem(
    cartId: string,
    productId: string,
    sizeId: string,
    quantity: number,
    tx: Prisma.TransactionClient,
  ) {
    return tx.cartItem.upsert({
      where: {
        cartId_productId_sizeId: {
          cartId,
          productId,
          sizeId,
        },
      },
      create: {
        cartId,
        productId,
        sizeId,
        quantity,
      },
      update: {
        quantity,
      },
    });
  }

  //장바구니에서 아이템 조회
  findCartWithItems(cartId: string, tx: Prisma.TransactionClient) {
    return tx.cart.findUniqueOrThrow({
      where: {
        id: cartId,
      },
      select: {
        items: true,
      },
    });
  }

  //장바구니 총 수량 업데이트
  updateCartTotalQuantity(
    cartId: string,
    quantity: number,
    tx: Prisma.TransactionClient,
  ) {
    return tx.cart.update({
      where: {
        id: cartId,
      },
      data: {
        quantity,
      },
    });
  }

  //트랜잭션 실행
  async executeTransaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  //장바구니 아이템 조회
  async getCartItem(cartItemId: string) {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: {
        id: cartItemId,
      },
      include: {
        product: {
          include: {
            store: true,
          },
        },
        size: true,
        cart: true,
      },
    });
    return cartItem;
  }

  //장바구니 아이템 삭제
  async deleteCartItem(cartItemId: string, tx: Prisma.TransactionClient) {
    const cartItem = await tx.cartItem.delete({
      where: {
        id: cartItemId,
      },
    });
    return cartItem;
  }
}
