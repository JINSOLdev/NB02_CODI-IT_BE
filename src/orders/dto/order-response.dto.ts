import { ApiProperty } from '@nestjs/swagger';

/**
 * ✅ 사이즈 정보 (en/ko 구조로 변경)
 */
class SizeNameDto {
  @ApiProperty() en: string;
  @ApiProperty() ko: string;
}

class SizeDto {
  @ApiProperty() id: number;
  @ApiProperty({ type: SizeNameDto })
  size: SizeNameDto;
}

/**
 * 상품 리뷰 요약
 */
class ProductReviewDto {
  @ApiProperty() id: string;
  @ApiProperty() rating: number;
  @ApiProperty() content: string;
  @ApiProperty() createdAt: Date;
}

/**
 * 상품 정보
 */
class ProductDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ required: false }) image?: string;
  @ApiProperty({ type: [ProductReviewDto], required: false })
  reviews?: ProductReviewDto[];
}

/**
 * 주문 상품 항목
 */
class OrderItemResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() price: number;
  @ApiProperty() quantity: number;
  @ApiProperty() productId: string;
  @ApiProperty({ type: ProductDto }) product: ProductDto;
  @ApiProperty({ type: SizeDto }) size: SizeDto; // ✅ 수정된 구조 반영
  @ApiProperty() isReviewed: boolean;
}

/**
 * ✅ 결제 정보 (필드명 payments 기준)
 */
class PaymentDto {
  @ApiProperty() id: string;
  @ApiProperty() price: number;
  @ApiProperty() status: string; // e.g. "CompletedPayment"
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty() orderId: string;
}

/**
 * ✅ 주문 응답 DTO (Swagger 구조 기준)
 */
export class OrderResponseDto {
  @ApiProperty() id: string;

  @ApiProperty({ description: '수령인 이름' })
  name: string;

  @ApiProperty({ description: '수령인 연락처' })
  phoneNumber: string;

  @ApiProperty() address: string;
  @ApiProperty() subtotal: number;
  @ApiProperty() totalQuantity: number;
  @ApiProperty() usePoint: number;

  @ApiProperty() createdAt: Date;

  @ApiProperty({ type: [OrderItemResponseDto] })
  orderItems: OrderItemResponseDto[];

  // ✅ Swagger는 'payments' 단수 아님
  @ApiProperty({ type: PaymentDto })
  payments: PaymentDto;
}
