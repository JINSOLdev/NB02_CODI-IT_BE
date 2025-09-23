import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { UserType } from '@prisma/client';

@Injectable()
export class MockAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();

    const id = req.header('x-user-id') ?? 'seller_demo';
    const type =
      (req.header('x-user-role') as UserType | undefined) ?? UserType.SELLER;

    req.user = { id, type };
    return true;
  }
}
