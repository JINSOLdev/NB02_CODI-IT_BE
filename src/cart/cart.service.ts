import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CartRepository } from './cart.repository';
import { createOrUpdateCartItemsDto } from './cart.dto';
import { Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
@Injectable()
export class CartService {
  constructor(
    private cartRepository: CartRepository,
    private prisma: PrismaService,
  ) {}

  private readonly logger = new Logger(CartService.name);

  // 사용자의 장바구니를 생성하거나 이미 존재하는 장바구니를 반환
  async createCart(buyerId: string) {
    const cart = await this.cartRepository.createOrGetCart(buyerId);
    if (!cart) {
      this.logger.error('장바구니 생성 실패');
      throw new BadRequestException('장바구니 생성 실패');
    }
    return cart;
  }

  async getCart(buyerId: string) {
    const cart = await this.cartRepository.getCartByBuyerId(buyerId);
    if (!cart) {
      this.logger.error(`장바구니 조회 실패 ${buyerId}`);
      return [];
    }
    return cart;
  }

  async createOrUpdateCartItemAndReturnCart(
    buyerId: string,
    createOrUpdateCartItemsDto: createOrUpdateCartItemsDto,
  ) {
    const cart = await this.cartRepository.getCartByBuyerId(buyerId);
    if (!cart) {
      this.logger.error('장바구니를 찾을 수 없습니다');
      throw new BadRequestException('장바구니를 찾을 수 없습니다');
    }
    return this.cartRepository.executeTransaction(async (tx) => {
      // 상품 확인
      const product = await this.prisma.product.findUnique({
        where: {
          id: createOrUpdateCartItemsDto.productId,
        },
      });
      if (!product) {
        this.logger.error('상품을 찾을 수 없습니다');
        throw new BadRequestException('상품을 찾을 수 없습니다');
      }
      // 1. 장바구니 아이템 업데이트
      for (const size of createOrUpdateCartItemsDto.sizes) {
        // 상품의 사이즈 확인
        const stockSize = await this.prisma.stockSize.findUnique({
          where: {
            id: size.sizeId,
          },
        });
        if (!stockSize) {
          this.logger.error('사이즈를 찾을 수 없습니다');
          throw new BadRequestException('사이즈를 찾을 수 없습니다');
        }
        // 장바구니 아이템 업데이트
        await this.cartRepository.upsertCartItem(
          cart.id,
          createOrUpdateCartItemsDto.productId,
          size.sizeId,
          size.quantity,
          tx,
        );
      }

      // 2. 장바구니 아이템 조회
      const cartItems = await this.cartRepository.findCartWithItems(
        cart.id,
        tx,
      );
      // 3. 장바구니의 총 수량 계산
      const totalQuantityForCart = cartItems.items.reduce(
        (total, item) => total + item.quantity,
        0,
      );
      // 4. 장바구니의 총 수량 업데이트
      await this.cartRepository.updateCartTotalQuantity(
        cart.id,
        totalQuantityForCart,
        tx,
      );

      // 5. 최종 결과 반환
      const updatedCart = await this.cartRepository.getCartByBuyerId(
        buyerId,
        tx,
      );
      return updatedCart!;
    });
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
    return this.cartRepository.executeTransaction(async (tx) => {
      //1. 장바구니 아이템 삭제
      await this.cartRepository.deleteCartItem(cartItemId, tx);
      //2. 장바구니 조회
      const cart = await this.cartRepository.getCartByBuyerId(userId, tx);
      if (!cart) {
        this.logger.error('장바구니 조회 실패');
        throw new NotFoundException('장바구니를 찾을 수 없습니다');
      }
      //3. 장바구니의 총 수량 계산
      const totalQuantityForCart = cart.items.reduce(
        (total, item) => total + item.quantity,
        0,
      );
      //4. 장바구니의 총 수량 업데이트
      await this.cartRepository.updateCartTotalQuantity(
        cart.id,
        totalQuantityForCart,
        tx,
      );
      return { message: '장바구니 아이템 삭제 성공' };
    });
  }
}
