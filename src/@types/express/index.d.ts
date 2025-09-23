// 유저(인증) API 완성되면 삭제할 예정
import { UserType } from '@prisma/client';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      type: UserType;
    };
  }
}
