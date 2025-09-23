// Define GradeLevel as a string literal union matching the enum values used in the code.
// This avoids importing a non-exported type from @prisma/client.
export type GradeLevel = 'GREEN' | 'ORANGE' | 'RED' | 'BLACK' | 'VIP';

export type GradePayload = {
  id: string;
  name: string;
  rate: number;
  minAmount: number;
};

export const GRADE_MAP: Record<GradeLevel, GradePayload> = {
  GREEN: { id: 'grade_green', name: 'green', rate: 1, minAmount: 0 },
  ORANGE: { id: 'grade_orange', name: 'orange', rate: 2, minAmount: 100000 },
  RED: { id: 'grade_red', name: 'red', rate: 3, minAmount: 300000 },
  BLACK: { id: 'grade_black', name: 'black', rate: 4, minAmount: 500000 },
  VIP: { id: 'grade_vip', name: 'vip', rate: 5, minAmount: 1000000 },
};
