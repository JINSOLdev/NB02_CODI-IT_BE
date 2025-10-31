import { ApiProperty } from '@nestjs/swagger';

class StockResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  size: string;

  @ApiProperty()
  quantity: number;
}

class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  image?: string;

  @ApiProperty({ required: false })
  content?: string;

  @ApiProperty()
  price: number;

  @ApiProperty({ required: false })
  discountRate?: number;

  @ApiProperty({ required: false })
  discountPrice?: number;

  @ApiProperty({ required: false })
  discountStartTime?: Date;

  @ApiProperty({ required: false })
  discountEndTime?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  storeId: string;

  @ApiProperty()
  storeName: string;

  @ApiProperty()
  reviewsRating: number;

  @ApiProperty()
  reviewsCount: number;

  @ApiProperty({ type: () => CategoryResponseDto })
  category: CategoryResponseDto; // ✅ 단일 객체로 변경

  @ApiProperty({ type: () => [StockResponseDto] })
  stocks: StockResponseDto[];
}
