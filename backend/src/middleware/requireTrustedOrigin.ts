import type { RequestHandler } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defense in depth for cookie-authenticated routes. The session cookie is already
 * SameSite=Lax, so browsers won't attach it to cross-site writes; this additionally rejects
 * state-changing requests whose Origin header names a site we don't trust.
 */
export function requireTrustedOrigin(allowedOrigins: readonly string[]): RequestHandler {
  const allowed = new Set(allowedOrigins);
  return (req, res, next) => {
    const origin = req.get('origin');
    if (SAFE_METHODS.has(req.method) || !origin || allowed.has(origin)) {
      next();
      return;
    }
    res.status(403).json({ error: 'Origin not allowed' });
  };
}
