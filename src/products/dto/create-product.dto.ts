import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CategoryType } from '@prisma/client';

/** 프론트 요청 DTO */
export class CreateStockDto {
  @IsString()
  @IsNotEmpty()
  sizeName: string; // 프론트에서 넘어오는 값 (xs, s, m, l, ...)

  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}

/** DB 저장용 타입 (서비스 내부에서 변환 후 사용) */
export interface TransformedStock {
  sizeId: string;
  quantity: number;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsOptional()
  discountRate?: number;

  // 서비스에서 계산됨
  @IsNumber()
  @IsOptional()
  discountPrice?: number | null;

  @IsString()
  @IsOptional()
  discountStartTime?: string;

  @IsString()
  @IsOptional()
  discountEndTime?: string;

  // ✅ enum 그대로 사용 (string 아님)
  @IsEnum(CategoryType)
  categoryName: CategoryType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStockDto)
  stocks: CreateStockDto[];
}
