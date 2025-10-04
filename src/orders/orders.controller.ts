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
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthUser } from '../auth/auth.types';
import { UserType } from '@prisma/client';

@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * 주문 생성 (구매자 전용)
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrder(
    @Req() req: { user: AuthUser },
    @Body() dto: CreateOrderDto,
  ) {
    const user = req.user;

    // ✅ 구매자만 접근 가능
    if (user.type !== UserType.BUYER) {
      throw new ForbiddenException('구매자만 주문할 수 있습니다.');
    }

    try {
      return await this.ordersService.createOrder(user.userId, dto);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(`주문 생성 실패: ${error.message}`);
      }
      throw new BadRequestException('주문 생성 실패: 알 수 없는 오류');
    }
  }
}
