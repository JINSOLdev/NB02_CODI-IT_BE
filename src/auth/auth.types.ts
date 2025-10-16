import type { Request as ExpressRequest } from 'express';
import { UserType } from '@prisma/client';
import { CreateOrderDto } from 'src/orders/dto/create-order.dto';

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
  id(orderId: string, id: any, dto: Partial<CreateOrderDto>): unknown;
  userId: string;
  email: string;
  type: UserType;
  points: number;
  grade: GradeSummary;
};

export type CookieMap = Record<string, string | undefined>;
export type RequestWithCookies = Omit<ExpressRequest, 'cookies'> & {
  cookies: CookieMap;
};

export interface JwtPrincipal {
  userId: string;
  email?: string;
  type?: UserType;
}

export type RequestWithUser = Omit<ExpressRequest, 'user'> & {
  user: JwtPrincipal;
};
