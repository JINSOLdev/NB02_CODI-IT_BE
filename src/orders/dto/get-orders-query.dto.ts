import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client'; // ✅ OrderStatus로 변경
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class GetOrdersQueryDto {
  @ApiPropertyOptional({
    description:
      '주문 상태 필터링 (예: PROCESSING, SHIPPED, CANCELED, COMPLETEDPAYMENT)',
    enum: OrderStatus, // ✅ OrderStatus로 변경
  })
  @IsOptional()
  @IsEnum(OrderStatus) // ✅ 유효성 검사도 OrderStatus 기준으로
  status?: OrderStatus;

  @ApiPropertyOptional({ description: '페이지당 항목 수', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: '페이지 번호', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;
}
