import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const incoming = (req.headers['x-trace-id'] as string | undefined)?.trim();
    const traceId = incoming && incoming.length > 0 ? incoming : randomUUID();
    req.traceId = traceId;
    res.setHeader('X-Trace-Id', traceId);
    next();
  }
}
