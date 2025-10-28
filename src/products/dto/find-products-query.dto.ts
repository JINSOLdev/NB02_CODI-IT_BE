import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType } from '@prisma/client';
import { Type, Transform } from 'class-transformer';
export class FindProductsQueryDto {
  @ApiPropertyOptional({ description: '페이지 번호 (기본값: 1)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: '페이지 크기 (기본값: 10)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number;

  @ApiPropertyOptional({
    description:
      '정렬 옵션 (recent | lowPrice | highPrice | salesRanking | highRating | mostReviewed)',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: '검색어' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '최소 가격' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priceMin?: number;

  @ApiPropertyOptional({ description: '최대 가격' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priceMax?: number;

  @ApiPropertyOptional({ description: '사이즈 (예: S, M, L, Free)' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ description: '즐겨찾기 스토어 ID' })
  @IsOptional()
  @IsString()
  favoriteStore?: string;

  @ApiPropertyOptional({
    description:
      '카테고리 이름 (TOP | BOTTOM | DRESS | OUTER | SKIRT | SHOES | ACC)',
  })
  @IsOptional()
  @IsEnum(CategoryType)
  @Transform(({ value }): CategoryType | undefined =>
    value === '' ? undefined : (value as CategoryType),
  )
  categoryName?: CategoryType;

  /** 🔧 내부 계산용 (Prisma skip/take 매핑) */
  get skip(): number {
    return this.page && this.pageSize ? (this.page - 1) * this.pageSize : 0;
  }

  get take(): number {
    return this.pageSize ?? 10;
  }
}
