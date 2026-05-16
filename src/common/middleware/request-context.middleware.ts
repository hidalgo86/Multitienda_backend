import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export interface RequestWithTrace extends Request {
  requestId?: string;
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: RequestWithTrace, res: Response, next: NextFunction): void {
    const incomingRequestId = req.header('x-request-id');
    const requestId = incomingRequestId?.trim() || randomUUID();

    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    next();
  }
}
