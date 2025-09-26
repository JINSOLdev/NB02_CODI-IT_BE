import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStockDto {
  @IsString()
  @IsOptional()
  sizeId?: string; //

  @IsNumber()
  @IsOptional()
  quantity?: number;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

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
  @IsOptional()
  categoryId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateStockDto)
  @IsOptional()
  stocks?: UpdateStockDto[];
}
