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
  storeId: string;

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
  discountPrice?: number;

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
