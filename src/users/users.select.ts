import type { Prisma } from '@prisma/client';

export const USER_AUTH_SELECT: Prisma.UserSelect = {
  id: true,
  email: true,
  nickname: true,
  type: true,
  gradeLevel: true,
  passwordHash: true,
};

export const STORE_BRIEF_SELECT: Prisma.StoreSelect = {
  id: true,
  name: true,
  address: true,
  detailAddress: true,
  phoneNumber: true,
  content: true,
  image: true,
  createdAt: true,
  updatedAt: true,
};

export const FAVORITE_WITH_STORE_SELECT: Prisma.FavoriteStoreSelect = {
  userId: true,
  storeId: true,
  store: { select: STORE_BRIEF_SELECT },
};
