import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthUser } from '../auth/auth.types';
import { UserType } from '@prisma/client';

@Controller('api/orders') // ✅ 여기만 수정
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /** 🛒 주문 생성 (구매자 전용) */
  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrder(
    @Req() req: { user: AuthUser },
    @Body() dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    const user = req.user;

    // ✅ 구매자만 접근 가능
    if (user.type !== UserType.BUYER) {
      throw new ForbiddenException('권한이 필요한 요청입니다.');
    }

    try {
      return await this.ordersService.createOrder(user.userId, dto);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException('잘못된 요청입니다.');
      }
      throw error;
    }
  }
}
