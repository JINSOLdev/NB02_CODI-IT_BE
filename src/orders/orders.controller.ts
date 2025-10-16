import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthUser } from '../auth/auth.types';
import { UserType } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('api/orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * 🛒 주문 생성 (구매자 전용)
   */
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
    if (user.type !== UserType.BUYER) {
      throw new ForbiddenException('권한이 필요한 요청입니다.');
    }

    return this.ordersService.createOrder(user.userId, dto);
  }

  /**
   * ✏️ 주문 수정 (구매자 전용)
   */
  @Patch(':orderId')
  @ApiOperation({ summary: '주문 수정 (구매자 전용)' })
  @ApiResponse({
    status: 200,
    description: '주문 수정 성공',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 403, description: '권한이 없는 사용자 접근' })
  async updateOrder(
    @Req() req: { user: AuthUser },
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderDto,
  ): Promise<OrderResponseDto> {
    const user = req.user;
    if (user.type !== UserType.BUYER) {
      throw new ForbiddenException('권한이 필요한 요청입니다.');
    }

    return this.ordersService.updateOrder(orderId, user.userId, dto);
  }

  /**
   * ❌ 주문 취소 (구매자 전용)
   */
  @Delete(':orderId')
  @ApiOperation({ summary: '주문 취소 (구매자 전용)' })
  @ApiResponse({ status: 200, description: '주문 취소 성공' })
  @ApiResponse({ status: 403, description: '권한이 없는 사용자 접근' })
  async cancelOrder(
    @Req() req: { user: AuthUser },
    @Param('orderId') orderId: string,
  ): Promise<{ message: string }> {
    const user = req.user;
    if (user.type !== UserType.BUYER) {
      throw new ForbiddenException('권한이 필요한 요청입니다.');
    }

    await this.ordersService.cancelOrder(orderId, user.userId);
    return { message: '주문이 성공적으로 취소되었습니다.' };
  }
}
