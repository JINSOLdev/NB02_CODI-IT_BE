import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
export class createCartDto {
  @IsString()
  userId: string;
}

class SizeDto {
  @IsString()
  sizeId: string;

  @IsNumber()
  quantity: number;
}
export class createOrUpdateCartItemsDto {
  @IsString()
  productId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SizeDto)
  sizes: SizeDto[];
}
