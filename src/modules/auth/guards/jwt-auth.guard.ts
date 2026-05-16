import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Soporte para contexto GraphQL: devolver la request correcta
  getRequest(context: ExecutionContext) {
    const ctxType = context.getType<'http' | 'rpc' | 'ws' | 'graphql'>();
    if (ctxType === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const ctx = gqlCtx.getContext<unknown>();
      if (ctx && typeof ctx === 'object' && 'req' in ctx) {
        return (ctx as { req?: Request }).req;
      }
      return undefined as unknown;
    }
    return context.switchToHttp().getRequest<Request>();
  }
}
