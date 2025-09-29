import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStockDto {
  @IsString()
  @IsNotEmpty()
  sizeId: string;

  @IsNumber()
  @IsNotEmpty()
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

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStockDto)
  stocks: CreateStockDto[];
}
