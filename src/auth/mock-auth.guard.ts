import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { UserRole } from '@prisma/client';

@Injectable()
export class MockAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();

    const id = req.header('x-user-id') ?? 'seller_demo';
    const role =
      (req.header('x-user-role') as UserRole | undefined) ?? UserRole.SELLER;

    req.user = { id, role };
    return true;
  }
}
