import { ApiProperty } from '@nestjs/swagger';

class SizeInfoDto {
  @ApiProperty() en: string;
  @ApiProperty() ko: string;
}

class SizeDto {
  @ApiProperty() id: number;
  @ApiProperty({ type: SizeInfoDto }) size: SizeInfoDto;
}

class ProductReviewDto {
  @ApiProperty() id: string;
  @ApiProperty() rating: number;
  @ApiProperty() content: string;
  @ApiProperty() createdAt: Date;
}

class ProductDto {
  @ApiProperty() name: string;
  @ApiProperty({ required: false }) image?: string;
  @ApiProperty({ type: [ProductReviewDto] }) reviews: ProductReviewDto[];
}

class OrderItemResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() price: number;
  @ApiProperty() quantity: number;
  @ApiProperty() isReviewed: boolean;
  @ApiProperty() productId: string;
  @ApiProperty({ type: ProductDto }) product: ProductDto;
  @ApiProperty({ type: SizeDto }) size: SizeDto;
}

class PaymentDto {
  @ApiProperty() id: string;
  @ApiProperty() price: number;
  @ApiProperty() status: string;
  @ApiProperty() createdAt: Date;
}

export class OrderResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() phoneNumber: string;
  @ApiProperty() address: string;
  @ApiProperty() subtotal: number;
  @ApiProperty() totalQuantity: number;
  @ApiProperty() usePoint: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty({ type: [OrderItemResponseDto] })
  orderItems: OrderItemResponseDto[];
  @ApiProperty({ type: PaymentDto }) payments: PaymentDto;
}
