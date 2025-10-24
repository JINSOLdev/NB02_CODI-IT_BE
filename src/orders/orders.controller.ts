import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Query,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
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
  @ApiResponse({ status: 201, type: OrderResponseDto })
  createOrder(
    @Req() req: { user: AuthUser & { id?: string; sub?: string } },
    @Body() dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    const user = req.user;
    const userId = user.userId ?? user.id ?? user.sub;

    if (user.type !== UserType.BUYER) {
      throw new ForbiddenException('권한이 필요한 요청입니다.');
    }

    return this.ordersService.createOrder(userId, dto);
  }

  /**
   * ✏️ 주문 수정 (구매자 전용)
   */
  @Patch(':orderId')
  @ApiOperation({ summary: '주문 수정 (구매자 전용)' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  updateOrder(
    @Req() req: { user: AuthUser & { id?: string; sub?: string } },
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderDto,
  ): Promise<OrderResponseDto> {
    const user = req.user;
    const userId = user.userId ?? user.id ?? user.sub;

    if (user.type !== UserType.BUYER) {
      throw new ForbiddenException('권한이 필요한 요청입니다.');
    }

    return this.ordersService.updateOrder(orderId, userId, dto);
  }

  /**
   * ❌ 주문 취소 (구매자 전용)
   */
  @Delete(':orderId')
  @ApiOperation({ summary: '주문 취소 (구매자 전용)' })
  @ApiResponse({ status: 200, description: '주문 취소 성공' })
  cancelOrder(
    @Req() req: { user: AuthUser & { id?: string; sub?: string } },
    @Param('orderId') orderId: string,
  ): Promise<{ message: string }> {
    const user = req.user;
    const userId = user.userId ?? user.id ?? user.sub;

    if (user.type !== UserType.BUYER) {
      throw new ForbiddenException('권한이 필요한 요청입니다.');
    }

    return this.ordersService
      .cancelOrder(orderId, userId)
      .then(() => ({ message: '주문이 성공적으로 취소되었습니다.' }));
  }

  /**
   * 📦 주문 목록 조회 (구매자 전용, 페이지네이션 포함)
   */
  @Get()
  @ApiOperation({ summary: '주문 목록 조회 (페이지네이션 포함)' })
  @ApiResponse({ status: 200, description: '주문 목록 조회 성공' })
  getOrders(
    @Req() req: { user: AuthUser & { id?: string; sub?: string } },
    @Query() query: GetOrdersQueryDto,
  ) {
    const user = req.user;
    const userId = user.userId ?? user.id ?? user.sub;

    if (user.type !== UserType.BUYER) {
      throw new ForbiddenException('권한이 필요한 요청입니다.');
    }

    return this.ordersService.getOrders(userId, query);
  }

  /**
   * 🔍 주문 상세 조회 (구매자 전용)
   */
  @Get(':orderId')
  @ApiOperation({ summary: '주문 상세 조회 (구매자 전용)' })
  @ApiResponse({ status: 200, description: '주문 상세 조회 성공' })
  getOrderDetail(
    @Req() req: { user: AuthUser & { id?: string; sub?: string } },
    @Param('orderId') orderId: string,
  ) {
    const user = req.user;
    const userId = user.userId ?? user.id ?? user.sub;

    if (user.type !== UserType.BUYER) {
      throw new ForbiddenException('권한이 필요한 요청입니다.');
    }

    return this.ordersService.getOrderDetail(orderId, userId);
  }
}
