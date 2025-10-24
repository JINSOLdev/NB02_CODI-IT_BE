export class ProductDetailResponseDto {
  id: string;
  name: string;
  image?: string;
  content?: string;
  price: number;
  discountRate?: number;
  discountPrice?: number;
  discountStartTime?: Date;
  discountEndTime?: Date;
  createdAt: Date;
  updatedAt: Date;

  storeId: string;
  storeName: string;

  reviewsRating: number;
  reviewsCount: number;

  category: {
    id: string;
    name: string;
  };

  stocks: {
    id: string;
    size: string;
    quantity: number;
  }[];

  inquiries: {
    id: string;
    title: string;
    content: string;
    status: string;
    isSecret: boolean;
    createdAt: Date;
    updatedAt: Date;
    reply?: {
      id: string;
      content: string;
      createdAt: Date;
      updatedAt: Date;
      user: {
        id: string;
        name: string;
      };
    };
  }[];
}
