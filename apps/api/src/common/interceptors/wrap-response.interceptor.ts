import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiEnvelope, isEnvelope } from '../api-envelope';
import { randomUUID } from 'crypto';

@Injectable()
export class WrapResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const traceId: string = req.traceId ?? randomUUID();
    const timestamp = new Date().toISOString();

    return next.handle().pipe(
      map((data) => {
        if (isEnvelope(data)) {
          return {
            ...data,
            meta: {
              traceId,
              timestamp,
            },
          } as ApiEnvelope<any>;
        }

        return {
          ok: true,
          data,
          meta: {
            traceId,
            timestamp,
          },
        };
      }),
    );
  }
}
