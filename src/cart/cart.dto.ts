export class createCartItemDto {
  cartId: string;
  productId: string;
  quantity: number;
}

export class createCartDto {
  userId: string;
}

export class createOrUpdateCartItemDto {
  productId: string;
  sizeId: string;
  quantity: number;
}

export class createOrUpdateCartItemInputDto {
  productId: string;
  sizes: {
    sizeId: string;
    quantity: number;
  }[];
}
