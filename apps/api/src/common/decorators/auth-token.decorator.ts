import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AUTH_COOKIE_NAME } from '../config/cookie.config';

export const AuthToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.cookies?.[AUTH_COOKIE_NAME];
  },
);
