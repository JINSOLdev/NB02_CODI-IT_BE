import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FindProductsQueryDto {
  @ApiPropertyOptional({ description: '상품 이름 검색' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '최소 가격' })
  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({ description: '최대 가격' })
  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ description: '카테고리 ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: '페이지네이션 skip', default: 0 })
  @IsOptional()
  @IsNumber()
  skip?: number;

  @ApiPropertyOptional({ description: '페이지네이션 take', default: 10 })
  @IsOptional()
  @IsNumber()
  take?: number;

  @ApiPropertyOptional({
    description: '정렬 옵션 (lowPrice | highPrice | recent | salesRanking)',
  })
  @IsOptional()
  @IsString()
  sort?: string;
}
