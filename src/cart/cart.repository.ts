import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createOrUpdateCartItemsDto } from './cart.dto';

@Injectable()
export class CartRepository {
  constructor(private prisma: PrismaService) {}

  // buyerId로 장바구니 ID 조회
  async getCartIdByBuyerId(buyerId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: {
        buyerId,
      },
    });
    return cart;
  }

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
  async getCartByBuyerId(buyerId: string) {
    const cart = await this.prisma.cart.findUnique({
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

  // cartId와 productId, {sizeId, quantity}로 장바구니 아이템 업데이트
  async createOrUpdateCartItemAndReturnCart(
    cartId: string,
    createOrUpdateCartItemsDto: createOrUpdateCartItemsDto,
  ) {
    const sizes = createOrUpdateCartItemsDto.sizes;
    await this.prisma.$transaction(async (prisma) => {
      for (const size of sizes) {
        //장바구니 아이템 업데이트
        await prisma.cartItem.upsert({
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
      }
      //장바구니 아이템 조회
      const cartItems = await prisma.cart.findUniqueOrThrow({
        where: {
          id: cartId,
        },
        select: {
          items: true,
        },
      });
      //장바구니의 총 수량 계산
      const totalQuantityForCart = cartItems.items.reduce(
        (total, item) => total + item.quantity,
        0,
      );
      //장바구니의 총 수량 업데이트
      await prisma.cart.update({
        where: {
          id: cartId,
        },
        data: {
          quantity: totalQuantityForCart,
        },
      });
    });
    //장바구니 조회
    const cart = await this.prisma.cart.findUniqueOrThrow({
      where: {
        id: cartId,
      },
      include: {
        items: true,
      },
    });
    return cart;
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
  async deleteCartItem(cartItemId: string) {
    const cartItem = await this.prisma.cartItem.delete({
      where: {
        id: cartItemId,
      },
    });
    return cartItem;
  }
}
