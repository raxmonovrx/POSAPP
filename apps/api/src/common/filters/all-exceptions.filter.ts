import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { ApiErr } from '../api-envelope';

type ErrorDetail = { field: string; issue: string };

function mapStatusToCode(status: number): string {
  if (status === HttpStatus.BAD_REQUEST) return 'BAD_REQUEST';
  if (status === HttpStatus.UNAUTHORIZED) return 'UNAUTHORIZED';
  if (status === HttpStatus.FORBIDDEN) return 'FORBIDDEN';
  if (status === HttpStatus.NOT_FOUND) return 'NOT_FOUND';
  if (status === HttpStatus.CONFLICT) return 'CONFLICT';
  if (status === HttpStatus.UNPROCESSABLE_ENTITY) return 'UNPROCESSABLE_ENTITY';
  if (status >= 500) return 'INTERNAL_SERVER_ERROR';
  return 'ERROR';
}

function validationDetails(
  exception: HttpException,
): ErrorDetail[] | undefined {
  if (!(exception instanceof BadRequestException)) return undefined;
  const resp = exception.getResponse();
  const obj = typeof resp === 'object' && resp ? (resp as any) : null;
  if (!obj?.message || !Array.isArray(obj.message)) return undefined;

  return obj.message.map((m: string) => {
    const [field, ...rest] = String(m).split(' ');
    return { field, issue: rest.join(' ') || m };
  });
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const traceId = req.traceId ?? randomUUID();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const resp = isHttp ? exception.getResponse() : null;
    const respObj = typeof resp === 'object' && resp ? (resp as any) : null;

    const message =
      (respObj?.message && Array.isArray(respObj.message)
        ? respObj.message[0]
        : respObj?.message) ||
      (exception as any)?.message ||
      'Internal server error';

    const details = validationDetails(exception as HttpException);

    const payload: ApiErr = {
      ok: false,
      error: {
        code: respObj?.code ?? mapStatusToCode(status),
        message: Array.isArray(message) ? message.join(', ') : String(message),
        ...(details ? { details } : {}),
      },
      meta: {
        traceId,
        timestamp: new Date().toISOString(),
      },
    };

    res.status(status).json(payload);
  }
}
