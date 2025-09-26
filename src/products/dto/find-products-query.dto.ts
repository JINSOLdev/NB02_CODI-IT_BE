import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FindProductsQueryDto {
  @IsString()
  @IsOptional()
  search?: string; // 상품명 검색

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page: number = 1; // 기본값 1

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  pageSize: number = 10; // 기본값 10

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  priceMin?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  priceMax?: number;

  @IsString()
  @IsOptional()
  categoryName?: string; // CategoryType enum 값

  @IsString()
  @IsOptional()
  size?: string; // SizeType enum 값

  @IsString()
  @IsOptional()
  sort?: string; // 정렬 옵션: recent, lowPrice, highPrice, salesRanking 등
}
