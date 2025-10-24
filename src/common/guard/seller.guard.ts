import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { AuthUser } from 'src/auth/auth.types';
import { UserType } from '@prisma/client';

@Injectable()
export class SellerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: { user: AuthUser } = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.type !== UserType.SELLER) {
      throw new ForbiddenException('판매자만 접근 가능합니다');
    }

    return true;
  }
}
