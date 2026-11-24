import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

/** Never records URLs, queries, bodies, identities or authorization headers. */
export function requestDiagnostics(write: (entry: string) => void) {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = randomUUID();
    const started = performance.now();
    let recorded = false;
    res.setHeader('X-Request-Id', id);
    const record = (event: 'finished' | 'disconnected') => {
      if (recorded) return;
      recorded = true;
      const route =
        typeof req.route?.path === 'string' ? req.route.path : 'unmatched';
      write(
        JSON.stringify({
          requestId: id,
          method: req.method,
          route,
          status: event === 'finished' ? res.statusCode : null,
          event,
          durationMs: Math.round(performance.now() - started),
        }),
      );
    };
    res.once('finish', () => record('finished'));
    res.once('close', () => record('disconnected'));
    next();
  };
}
