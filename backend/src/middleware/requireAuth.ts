import type { Request, RequestHandler } from 'express';

/** Resolves the signed-in user's id from the request's session cookie, or null. */
export type GetUserId = (req: Request) => Promise<string | null>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      /** Id of the authenticated user, set by `requireAuth`. */
      userId: string;
    }
  }
}

export function requireAuth(getUserId: GetUserId): RequestHandler {
  return async (req, res, next) => {
    const userId = await getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Not signed in' });
      return;
    }
    res.locals.userId = userId;
    next();
  };
}
