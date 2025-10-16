import { NotificationType, UserType } from '@prisma/client';

export const BUYER_ALLOWED: NotificationType[] = [
  'OUT_OF_STOCK_CART',
  'OUT_OF_STOCK_ORDER',
  'INQUIRY_ANSWERED',
  'SYSTEM',
];

export const SELLER_ALLOWED: NotificationType[] = [
  'NEW_INQUIRY',
  'OUT_OF_STOCK_SELLER',
  'SYSTEM',
];

export const allowedByUserType = (userType: UserType): NotificationType[] =>
  userType === 'SELLER' ? SELLER_ALLOWED : BUYER_ALLOWED;
