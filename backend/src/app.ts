import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import express, { type Express } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { CLIENT_IP_HEADER } from './auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requireAuth, type GetUserId } from './middleware/requireAuth.js';
import { requireTrustedOrigin } from './middleware/requireTrustedOrigin.js';
import { extractRouter } from './routes/extract.js';
import { flashcardsRouter } from './routes/flashcards.js';
import type { JlptLevel } from './services/demoGenerator.js';
import type { FlashcardRepository } from './services/flashcardRepository.js';
import type { PageFetcher } from './services/pageFetcher.js';
import type { MnemonicGenerator } from './services/mnemonicGenerator.js';

export interface AppDependencies {
  getUserId: GetUserId;
  generator: MnemonicGenerator;
  repository: FlashcardRepository;
  /** Origins allowed to make cookie-authenticated, state-changing requests. */
  allowedOrigins: string[];
  /** Better Auth's Node handler, mounted at /api/auth. */
  authHandler?: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
  /** Max generation requests per user per 15 minutes. */
  generateRateLimit?: number;
  /** Number of reverse proxies in front of the app, used to resolve the client IP. */
  trustProxyHops?: number;
  /** Directory containing the built frontend; when set it is served with an SPA fallback. */
  staticDir?: string;
  /** Set in demo mode: the words that have complete sample cards, by JLPT level. */
  demoSampleWords?: Record<JlptLevel, string[]>;
  /** Fetches web pages for the "from a website" source; the route is disabled when absent. */
  fetchPage?: PageFetcher;
}

export function createApp({
  getUserId,
  generator,
  repository,
  allowedOrigins,
  authHandler,
  generateRateLimit = 20,
  trustProxyHops = 0,
  staticDir,
  demoSampleWords,
  fetchPage,
}: AppDependencies): Express {
  const app = express();
  app.set('trust proxy', trustProxyHops);

  app.use(
    helmet({
      contentSecurityPolicy: {
        // Report-only until verified in a real browser session.
        reportOnly: true,
        directives: {
          'default-src': ["'self'"],
          'img-src': ["'self'", 'data:'],
          'style-src': ["'self'", "'unsafe-inline'"],
          'worker-src': ["'self'", 'blob:'],
          // The Docker image serves plain HTTP; TLS is expected to terminate upstream.
          'upgrade-insecure-requests': null,
        },
      },
    }),
  );

  // Better Auth parses its own request bodies, so it must come before express.json().
  if (authHandler) {
    app.all('/api/auth/{*splat}', (req, res, next) => {
      // Better Auth rate-limits by IP but only reads it from headers, so pass along the
      // address Express resolved (honoring `trust proxy`), replacing anything the client sent.
      req.headers[CLIENT_IP_HEADER] = req.ip;
      authHandler(req, res).catch(next);
    });
  }

  app.use(express.json({ limit: '10kb' }));

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Public facts the frontend needs before sign-in.
  app.get('/api/meta', (_req, res) => {
    res.json({ demoMode: Boolean(demoSampleWords), sampleWords: demoSampleWords ?? null });
  });

  const generateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: generateRateLimit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (_req, res) => res.locals.userId,
    message: { error: 'Too many flashcard requests. Please try again later.' },
  });

  app.use(
    '/api/flashcards',
    requireTrustedOrigin(allowedOrigins),
    requireAuth(getUserId),
    flashcardsRouter({ generator, repository, generateLimiter }),
  );
  if (fetchPage) {
    app.use(
      '/api/extract-url',
      requireTrustedOrigin(allowedOrigins),
      requireAuth(getUserId),
      rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 30,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        keyGenerator: (_req, res) => res.locals.userId,
        message: { error: 'Too many pages fetched. Please try again later.' },
      }),
      extractRouter(fetchPage),
    );
  }

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  if (staticDir) {
    app.use(express.static(staticDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
