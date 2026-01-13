export type PageInfo = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type ApiOk<T> = {
  ok: true;
  data: T;
  meta: {
    traceId: string;
    timestamp: string;
  };
};

export type ApiErr = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: { field: string; issue: string }[];
  };
  meta: {
    traceId: string;
    timestamp: string;
  };
};

export type ApiEnvelope<T> = ApiOk<T> | ApiErr;

export function isEnvelope(x: any): x is { ok: boolean } {
  return x && typeof x === 'object' && typeof x.ok === 'boolean';
}
