import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { PartialType, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CategoryType } from '@prisma/client';
import { CreateProductDto } from './create-product.dto';

/** UpdateStockDto - 사이즈명은 항상 필수 */
export class UpdateStockDto {
  @IsString()
  @IsNotEmpty()
  sizeName: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;
}

/** UpdateProductDto */
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['stocks'] as const),
) {
  @IsOptional()
  @IsEnum(CategoryType)
  categoryName?: CategoryType;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateStockDto)
  stocks?: UpdateStockDto[];
}
