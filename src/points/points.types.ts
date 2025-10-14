import { GradeLevel, OrderStatus } from '@prisma/client';

// 포인트 트랜잭션 사유
export const REASON = {
  EARN_PURCHASE: 'EARN_PURCHASE',
  SPEND_ORDER: 'SPEND_ORDER',
  REVERT_CANCEL: 'REVERT_CANCEL',
  ADMIN_ADJUST: 'ADMIN_ADJUST',
} as const;
export type Reason = (typeof REASON)[keyof typeof REASON];

// 다음 등급 및 필요 누적액
export type NextGradeInfo = { next?: GradeLevel; need?: number };

// 포인트 적립/차감에 반영되는 주문 상태
export const COUNTED_ORDER_STATUS: OrderStatus[] = [
  OrderStatus.COMPLETEDPAYMENT,
];
