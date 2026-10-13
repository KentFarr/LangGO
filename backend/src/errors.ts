/**
 * An error whose message is safe to show to API clients. The error handler returns it with
 * its status; any other error becomes a generic 500.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly expose = true;

  constructor(status: number, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'HttpError';
    this.status = status;
  }
}
