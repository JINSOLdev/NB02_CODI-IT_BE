import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';

type Role = 'SELLER' | 'BUYER';
interface AuthUser {
  id: string;
  role: Role;
}

@Injectable()
export class MockAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    // ✅ getRequest 제네릭으로 Request & { user?: AuthUser } 지정
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();

    const id = req.header('x-user-id') ?? 'seller_demo';
    const role = (req.header('x-user-role') as Role | undefined) ?? 'SELLER';

    req.user = { id, role };
    return true;
  }
}
