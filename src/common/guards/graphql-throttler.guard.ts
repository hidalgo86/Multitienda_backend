import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  protected getRequestResponse(context: ExecutionContext) {
    if (context.getType<string>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      const { req, res } = gqlContext.getContext<{
        req: Record<string, unknown>;
        res: Record<string, unknown>;
      }>();

      return { req, res };
    }

    return super.getRequestResponse(context);
  }
}
