import 'express-serve-static-core';

type Role = 'SELLER' | 'BUYER';
interface AuthUser {
  id: string;
  role: Role;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}
