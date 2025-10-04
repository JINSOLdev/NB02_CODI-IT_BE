import { IsString, IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({ example: 'product1', description: '주문할 상품 ID' })
  @IsString()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 1, description: '사이즈 ID' })
  @IsInt()
  sizeId: number;

  @ApiProperty({ example: 2, description: '상품 수량' })
  @IsInt()
  @Min(1)
  quantity: number;
}
