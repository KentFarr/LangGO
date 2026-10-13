import { sql } from 'drizzle-orm';
import { index, integer, pgEnum, pgTable, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth-schema.js';

export * from './auth-schema.js';

/** Whether the card was requested by the user or suggested alongside them by the model. */
export const flashcardSource = pgEnum('flashcard_source', ['requested', 'related']);

export const flashcard = pgTable(
  'flashcard',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    word: text('word').notNull(),
    reading: text('reading').notNull(),
    meaning: text('meaning').notNull(),
    mnemonic: text('mnemonic').notNull(),
    source: flashcardSource('source').notNull(),
    /** JLPT level the word was chosen for (5 = N5 … 1 = N1); null for cards created before levels were stored. */
    jlptLevel: smallint('jlpt_level'),
    /** Days until the next review; doubles on success, halves (min 1) on failure. */
    reviewInterval: integer('review_interval').notNull().default(1),
    nextReviewAt: timestamp('next_review_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [index('flashcard_user_next_review_idx').on(table.userId, table.nextReviewAt)],
);

export type FlashcardRow = typeof flashcard.$inferSelect;
export type NewFlashcardRow = typeof flashcard.$inferInsert;
