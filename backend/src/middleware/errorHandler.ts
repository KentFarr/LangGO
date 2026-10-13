import type { ErrorRequestHandler } from 'express';

/** Last-resort handler: logs the error and returns a JSON body without leaking internals. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  // Only errors explicitly marked safe (the http-errors convention, used by Express's body
  // parser and by our HttpError) are shown to the client. Upstream errors such as OpenAI's
  // also carry a `status`, but their details must stay server-side.
  const status: unknown = err?.status ?? err?.statusCode;
  if (err?.expose === true && typeof status === 'number' && status >= 400 && status < 600) {
    if (status >= 500) console.error(`${status} ${err.message}`);
    res.status(status).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};
