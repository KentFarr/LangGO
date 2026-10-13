import type { RequestHandler } from 'express';

export type VerifyIdToken = (token: string) => Promise<{ uid: string }>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      /** Firebase uid of the authenticated caller, set by `requireAuth`. */
      uid: string;
    }
  }
}

/** Verifies the Firebase ID token in `Authorization: Bearer <token>` and exposes the uid. */
export function requireAuth(verifyIdToken: VerifyIdToken): RequestHandler {
  return async (req, res, next) => {
    const [scheme, token] = (req.get('authorization') ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      res.status(401).json({ error: 'Missing bearer token' });
      return;
    }

    try {
      res.locals.uid = (await verifyIdToken(token)).uid;
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    next();
  };
}
