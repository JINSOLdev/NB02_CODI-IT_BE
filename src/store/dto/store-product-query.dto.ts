import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class MyStoreProductQueryDto {
  @Type(() => Number) @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsInt() @Min(1) pageSize = 10;
}
