import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateOrderDto } from './create-order.dto';
import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @ApiProperty({
    example: '홍길동',
    required: false,
    description: '수령인 이름',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: '010-1234-5678',
    required: false,
    description: '수령인 전화번호',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: '서울특별시 강남구 테헤란로 1',
    required: false,
    description: '배송지 주소',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: 1000,
    required: false,
    description: '사용 포인트',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  usePoint?: number;

  /**
   * ✅ 주문 상태 변경 (예: PROCESSING → SHIPPED → COMPLETEDPAYMENT 등)
   */
  @ApiProperty({
    enum: OrderStatus,
    required: false,
    description: '주문 상태 (PROCESSING, SHIPPED, COMPLETEDPAYMENT, CANCELED)',
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  // 주문 상품 목록은 수정 시 제외
  orderItems?: never;
}
