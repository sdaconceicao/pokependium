import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { AccessTokenPayload } from '../types/AccessTokenPayload';

interface AuthenticatedRequest extends FastifyRequest {
  user: AccessTokenPayload;
}

export const User = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
