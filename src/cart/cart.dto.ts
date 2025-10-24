import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class createCartDto {
  @IsString()
  @ApiProperty({ example: 'user_id' })
  userId: string;
}

class SizeDto {
  @IsString()
  @ApiProperty({ example: 'size_id' })
  sizeId: string;

  @IsNumber()
  @ApiProperty({ example: 1 })
  quantity: number;
}
export class createOrUpdateCartItemsDto {
  @IsString()
  @ApiProperty({ example: 'product_id' })
  productId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SizeDto)
  @ApiProperty({ type: [SizeDto] })
  sizes: SizeDto[];
}
