import { UserType } from '@prisma/client';

export type GradeSummary = {
  id: string;
  name: string;
  rate: number;
  minAmount: number;
};

export type JwtPayloadCompat = {
  sub?: string;
  id?: string;
  userId?: string;
  email?: string;
  type?: UserType;
};

export type AuthUser = {
  userId: string;
  email: string;
  type: UserType;
  points: number;
  grade: GradeSummary;
};
