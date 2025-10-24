export class MyStoreDetailDto {
  id!: string;
  name!: string;
  userId!: string;
  address!: string;
  detailAddress!: string;
  phoneNumber!: string;
  content!: string;
  image?: string;
  productCount!: number;
  favoriteCount!: number;
  monthFavoriteCount!: number;
  totalSoldCount!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
