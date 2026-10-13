import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { MIGRATIONS_FOLDER } from '../src/db/client.js';
import * as schema from '../src/db/schema.js';
import type { GenerationResult } from '../src/services/mnemonicGenerator.js';

/** In-process Postgres with the real migrations applied. */
export async function createTestDatabase() {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return { db, close: () => client.close() };
}

export const card = (word: string) => ({
  word,
  reading: 'よみ',
  meaning: 'meaning',
  mnemonic: 'mnemonic',
});

export const generated: GenerationResult = {
  flashcards: [card('勉強'), card('学校')],
  relatedWords: [card('先生')],
};
