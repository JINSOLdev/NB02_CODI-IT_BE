import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthUser } from '../auth/auth.types';
import { UserType } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Orders')
@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * 🛒 주문 생성 (구매자 전용)
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: '주문 생성 (구매자 전용)' })
  @ApiResponse({
    status: 201,
    description: '주문 생성 성공',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 403, description: '권한이 없는 사용자 접근' })
  async createOrder(
    @Req() req: { user: AuthUser },
    @Body() dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    const user = req.user;

    // ✅ 구매자만 접근 가능
    if (user.type !== UserType.BUYER) {
      throw new ForbiddenException('권한이 필요한 요청입니다.');
    }

    // ✅ 서비스 예외 그대로 전달
    return await this.ordersService.createOrder(user.userId, dto);
  }
}
