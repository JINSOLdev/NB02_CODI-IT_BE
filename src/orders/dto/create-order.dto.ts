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
  @ApiProperty({ example: '김유저', description: '구매자 이름' })
  @IsString()
  name: string;

  @ApiProperty({ example: '010-1234-5678', description: '구매자 연락처' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '서울특별시 강남구', description: '배송지 주소' })
  @IsString()
  address: string;

  @ApiProperty({
    type: [CreateOrderItemDto],
    description: '주문할 상품 목록',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  orderItems: CreateOrderItemDto[];

  @ApiProperty({ example: 1000, description: '사용할 포인트 (0 이상)' })
  @IsInt()
  @Min(0)
  @IsOptional()
  usePoint: number = 0;
}
