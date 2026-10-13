import type { ErrorRequestHandler } from 'express';

/** Last-resort handler: logs the error and returns a JSON body without leaking internals. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  // Errors from body-parser and friends carry a 4xx `status` that is safe to expose.
  const status: unknown = err?.status ?? err?.statusCode;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    res.status(status).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};
