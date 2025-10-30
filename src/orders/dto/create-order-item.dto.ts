import { IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateOrderItemDto {
  @ApiProperty({
    example: 'cabc1234-5678-90ab-cdef-1234567890ab',
    description: '주문할 상품 ID',
  })
  @IsString() // ✅ UUID 대신 문자열 허용
  productId: string;

  @ApiProperty({ example: 3, description: '사이즈 ID' })
  @IsInt()
  @Transform(({ value }) => Number(value))
  sizeId: number;

  @ApiProperty({ example: 1, description: '수량' })
  @IsInt()
  @Min(1)
  @Transform(({ value }) => Number(value))
  quantity: number;
}
