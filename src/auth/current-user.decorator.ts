import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestWithUser } from './auth.types';

export const CurrentUser = createParamDecorator((_, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<RequestWithUser>();
  return req.user;
});
