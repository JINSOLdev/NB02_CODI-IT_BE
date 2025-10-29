import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/** 프론트 요청 DTO */
export class CreateStockDto {
  @IsString()
  @IsNotEmpty()
  sizeId: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}

/** DB 저장용 타입 */
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

  @IsNumber()
  @IsOptional()
  discountPrice?: number | null;

  @IsString()
  @IsOptional()
  discountStartTime?: string;

  @IsString()
  @IsOptional()
  discountEndTime?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  categoryName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStockDto)
  stocks: CreateStockDto[];
}
