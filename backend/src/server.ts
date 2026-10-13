import { existsSync } from 'node:fs';
import path from 'node:path';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import OpenAI from 'openai';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createFirestoreFlashcardRepository } from './services/flashcardRepository.js';
import { createOpenAIMnemonicGenerator } from './services/mnemonicGenerator.js';

const config = loadConfig();

// Credentials come from GOOGLE_APPLICATION_CREDENTIALS (path to a service-account JSON)
// or, on Google Cloud, from the attached service account.
const firebaseApp = initializeApp({ credential: applicationDefault() });
const auth = getAuth(firebaseApp);

const staticDir = path.resolve(import.meta.dirname, '../public');

const app = createApp({
  verifyIdToken: (token) => auth.verifyIdToken(token),
  generator: createOpenAIMnemonicGenerator(
    new OpenAI({ apiKey: config.OPENAI_API_KEY }),
    config.OPENAI_MODEL,
  ),
  repository: createFirestoreFlashcardRepository(getFirestore(firebaseApp)),
  generateRateLimit: config.GENERATE_RATE_LIMIT,
  staticDir: existsSync(staticDir) ? staticDir : undefined,
});

const server = app.listen(config.PORT, () => {
  console.log(`LangGo server listening on port ${config.PORT} (${config.NODE_ENV})`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    console.log(`${signal} received, shutting down`);
    server.close(() => process.exit(0));
  });
}
