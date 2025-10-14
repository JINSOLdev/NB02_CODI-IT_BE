export type GradeLevel = 'GREEN' | 'ORANGE' | 'RED' | 'BLACK' | 'VIP';

export type GradePayload = {
  earnRate: number;
  id: string;
  name: string;
  rate: number;
  minAmount: number;
};

export const GRADE_MAP: Record<GradeLevel, GradePayload> = {
  GREEN: {
    id: 'grade_green',
    name: 'green',
    rate: 1,
    minAmount: 0,
    earnRate: 0,
  },
  ORANGE: {
    id: 'grade_orange',
    name: 'orange',
    rate: 2,
    minAmount: 100000,
    earnRate: 0,
  },
  RED: {
    id: 'grade_red',
    name: 'red',
    rate: 3,
    minAmount: 300000,
    earnRate: 0,
  },
  BLACK: {
    id: 'grade_black',
    name: 'black',
    rate: 4,
    minAmount: 500000,
    earnRate: 0,
  },
  VIP: {
    id: 'grade_vip',
    name: 'vip',
    rate: 5,
    minAmount: 1000000,
    earnRate: 0,
  },
};
