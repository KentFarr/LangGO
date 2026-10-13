import path from 'node:path';
import express, { type Express } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.js';
import { requireAuth, type VerifyIdToken } from './middleware/requireAuth.js';
import { flashcardsRouter } from './routes/flashcards.js';
import type { FlashcardRepository } from './services/flashcardRepository.js';
import type { MnemonicGenerator } from './services/mnemonicGenerator.js';

export interface AppDependencies {
  verifyIdToken: VerifyIdToken;
  generator: MnemonicGenerator;
  repository: FlashcardRepository;
  /** Max generation requests per user per 15 minutes. */
  generateRateLimit?: number;
  /** Directory containing the built frontend; when set it is served with an SPA fallback. */
  staticDir?: string;
}

export function createApp({
  verifyIdToken,
  generator,
  repository,
  generateRateLimit = 20,
  staticDir,
}: AppDependencies): Express {
  const app = express();

  app.use(
    helmet({
      // Report-only until verified against the Firebase endpoints in a real browser session.
      contentSecurityPolicy: {
        reportOnly: true,
        directives: {
          'default-src': ["'self'"],
          'connect-src': ["'self'", 'https://*.googleapis.com'],
          'frame-src': ['https://*.firebaseapp.com'],
          'img-src': ["'self'", 'data:'],
          'style-src': ["'self'", "'unsafe-inline'"],
          'worker-src': ["'self'", 'blob:'],
          // The Docker image serves plain HTTP; TLS is expected to terminate upstream.
          'upgrade-insecure-requests': null,
        },
      },
    }),
  );
  app.use(express.json({ limit: '10kb' }));

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const generateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: generateRateLimit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (_req, res) => res.locals.uid,
    message: { error: 'Too many flashcard requests. Please try again later.' },
  });

  app.use(
    '/api/flashcards',
    requireAuth(verifyIdToken),
    generateLimiter,
    flashcardsRouter(generator, repository),
  );
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
