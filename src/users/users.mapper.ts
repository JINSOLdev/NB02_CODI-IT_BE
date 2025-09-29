import type { User } from '@prisma/client';
import { GRADE_MAP } from '../grades/grade.constants';

export type UserPayload = {
  id: string;
  email: string;
  name: string;
  type: 'BUYER' | 'SELLER';
  points: string;
  image: string | null;
  grade: { id: string; name: string; rate: number; minAmount: number };
};

export const toUserPayload = (u: User): UserPayload => ({
  id: u.id,
  email: u.email,
  name: u.nickname,
  type: u.type,
  points: String(u.points),
  image: u.image ?? null,
  grade: GRADE_MAP[u.gradeLevel],
});

export type FavoriteStoreItemDto = {
  storeId: string;
  userId: string;
  store: {
    id: string;
    name: string;
    address: string;
    detailAddress: string;
    phoneNumber: string;
    content: string;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
};

export type FavoriteWithStoreInput = {
  storeId: string;
  userId: string;
  store: {
    id: string;
    name: string;
    address: string;
    detailAddress: string;
    phoneNumber: string;
    content: string;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
};

export const toFavoriteStoreItem = (
  r: FavoriteWithStoreInput,
): FavoriteStoreItemDto => ({
  storeId: r.storeId,
  userId: r.userId,
  store: {
    id: r.store.id,
    name: r.store.name,
    address: r.store.address,
    detailAddress: r.store.detailAddress,
    phoneNumber: r.store.phoneNumber,
    content: r.store.content,
    image: r.store.image ?? null,
    createdAt: r.store.createdAt,
    updatedAt: r.store.updatedAt,
  },
});

export const toFavoriteStoreList = (
  rows: FavoriteWithStoreInput[],
): FavoriteStoreItemDto[] => rows.map(toFavoriteStoreItem);
