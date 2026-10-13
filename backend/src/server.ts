import { existsSync } from 'node:fs';
import path from 'node:path';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import OpenAI from 'openai';
import { createApp } from './app.js';
import { createAuth } from './auth.js';
import { allowedOrigins, loadConfig } from './config.js';
import { connectDatabase } from './db/client.js';
import { createFlashcardRepository } from './services/flashcardRepository.js';
import { createDemoMnemonicGenerator, SAMPLE_WORDS_BY_LEVEL } from './services/demoGenerator.js';
import { createOpenAIMnemonicGenerator } from './services/mnemonicGenerator.js';
import { createPageFetcher } from './services/pageFetcher.js';

const config = loadConfig();
const origins = allowedOrigins(config);

// Applies any pending migrations before the server starts accepting requests.
const database = await connectDatabase(config.DATABASE_URL);

const auth = createAuth(database.db, {
  secret: config.BETTER_AUTH_SECRET,
  baseURL: config.BETTER_AUTH_URL,
  trustedOrigins: origins,
});

const staticDir = path.resolve(import.meta.dirname, '../public');

const demoMode = !config.OPENAI_API_KEY;
if (demoMode) {
  console.warn('OPENAI_API_KEY is not set: running in demo mode with sample flashcards.');
}
const generator = config.OPENAI_API_KEY
  ? createOpenAIMnemonicGenerator(new OpenAI({ apiKey: config.OPENAI_API_KEY }), config.OPENAI_MODEL)
  : createDemoMnemonicGenerator();

const app = createApp({
  getUserId: async (req) =>
    (await auth.api.getSession({ headers: fromNodeHeaders(req.headers) }))?.user.id ?? null,
  authHandler: toNodeHandler(auth),
  generator,
  repository: createFlashcardRepository(database.db),
  allowedOrigins: origins,
  generateRateLimit: config.GENERATE_RATE_LIMIT,
  trustProxyHops: config.TRUST_PROXY_HOPS,
  staticDir: existsSync(staticDir) ? staticDir : undefined,
  demoSampleWords: demoMode ? SAMPLE_WORDS_BY_LEVEL : undefined,
  fetchPage: createPageFetcher(),
});

const server = app.listen(config.PORT, () => {
  console.log(
    `LangGo server listening on port ${config.PORT} (${config.NODE_ENV}${demoMode ? ', demo mode' : ''})`,
  );
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    console.log(`${signal} received, shutting down`);
    server.close(() => {
      database.close().finally(() => process.exit(0));
    });
  });
}
