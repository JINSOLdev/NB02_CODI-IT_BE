import { Type } from 'class-transformer';
import { IsArray, IsInt, Min, ValidateNested } from 'class-validator';
import { MyStoreProductListItemDto } from './store-product-list.dto';

export class MyStoreProductListWrapperDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MyStoreProductListItemDto)
  list!: MyStoreProductListItemDto[];

  @IsInt()
  @Min(0)
  totalCount!: number;
}
