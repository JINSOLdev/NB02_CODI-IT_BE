import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @ApiProperty({ example: 'test_store_id', description: '스토어 ID' })
  @IsString()
  storeId: string;

  @ApiProperty({ example: '김테스터', description: '수령인 이름' })
  @IsString()
  recipientName: string;

  @ApiProperty({ example: '010-1234-5678', description: '수령인 연락처' })
  @IsString()
  recipientPhone: string;

  @ApiProperty({ example: '서울특별시 강남구', description: '배송지 주소' })
  @IsString()
  address: string;

  @ApiProperty({ type: [CreateOrderItemDto], description: '주문할 상품 목록' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiProperty({ example: 0, description: '사용할 포인트 (0 이상)' })
  @IsInt()
  @Min(0)
  @IsOptional()
  usePoint = 0;

  @ApiProperty({ example: 48000, description: '총 결제 금액' })
  @IsInt()
  totalPrice: number;

  @ApiProperty({ example: 2, description: '총 상품 수량' })
  @IsInt()
  totalQuantity: number;

  @ApiProperty({ example: 50000, description: '상품 총액 (할인 전)' })
  @IsInt()
  subtotal: number;
}
