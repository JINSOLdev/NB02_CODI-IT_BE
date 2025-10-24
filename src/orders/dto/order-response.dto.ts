import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';

/**
 * ✅ 사이즈 정보 (en/ko 구조)
 */
class SizeNameDto {
  @ApiProperty()
  @Expose()
  en: string;

  @ApiProperty()
  @Expose()
  ko: string;
}

class SizeDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty({ type: SizeNameDto })
  @Expose()
  @Type(() => SizeNameDto)
  size: SizeNameDto;
}

/**
 * 상품 리뷰 요약
 */
class ProductReviewDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  rating: number;

  @ApiProperty()
  @Expose()
  content: string;

  @ApiProperty()
  @Expose()
  createdAt: Date;
}

/**
 * 상품 정보
 */
class ProductDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty({ required: false })
  @Expose()
  image?: string;

  @ApiProperty({ type: [ProductReviewDto], required: false })
  @Expose()
  @Type(() => ProductReviewDto)
  reviews?: ProductReviewDto[];
}

/**
 * 주문 상품 항목
 */
class OrderItemResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  price: number;

  @ApiProperty()
  @Expose()
  quantity: number;

  @ApiProperty()
  @Expose()
  productId: string;

  @ApiProperty({ type: ProductDto })
  @Expose()
  @Type(() => ProductDto)
  product: ProductDto;

  @ApiProperty({ type: SizeDto })
  @Expose()
  @Type(() => SizeDto)
  size: SizeDto;

  @ApiProperty()
  @Expose()
  isReviewed: boolean;
}

/**
 * ✅ 결제 정보
 */
class PaymentDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  price: number;

  @ApiProperty()
  @Expose()
  status: string; // e.g. "CompletedPayment"

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty()
  @Expose()
  orderId: string;
}

/**
 * ✅ 주문 응답 DTO (DB → API 변환)
 * DB의 recipientName / recipientPhone을 name / phone으로 노출
 */
export class OrderResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  // ✅ 추가된 주문 상태 필드
  @ApiProperty({ enum: OrderStatus, description: '주문 상태' })
  @Expose()
  status: OrderStatus;

  @ApiProperty({ description: '수령인 이름' })
  @Expose({ name: 'recipientName' })
  name: string;

  @ApiProperty({ description: '수령인 연락처' })
  @Expose({ name: 'recipientPhone' })
  phone: string;

  @ApiProperty()
  @Expose()
  address: string;

  @ApiProperty()
  @Expose()
  subtotal: number;

  @ApiProperty()
  @Expose()
  totalQuantity: number;

  @ApiProperty()
  @Expose()
  usePoint: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty({ type: [OrderItemResponseDto] })
  @Expose()
  @Type(() => OrderItemResponseDto)
  orderItems: OrderItemResponseDto[];

  @ApiProperty({ type: PaymentDto })
  @Expose()
  @Type(() => PaymentDto)
  payments: PaymentDto;
}
