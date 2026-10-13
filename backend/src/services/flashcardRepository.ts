import { and, desc, eq } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import { flashcard, type FlashcardRow } from '../db/schema.js';
import {
  initialSchedule,
  scheduleReview,
  type Flashcard,
  type FlashcardSource,
  type GeneratedCard,
} from '../domain/flashcard.js';

export interface NewCard extends GeneratedCard {
  source: FlashcardSource;
}

/** Every method is scoped to `userId`, so callers can never touch another user's cards. */
export interface FlashcardRepository {
  insertMany(userId: string, cards: NewCard[]): Promise<Flashcard[]>;
  listForUser(userId: string): Promise<Flashcard[]>;
  /** Applies a review and returns the updated card, or null if the user has no such card. */
  recordReview(userId: string, id: string, remembered: boolean): Promise<Flashcard | null>;
  /** Returns false if the user has no such card. */
  deleteForUser(userId: string, id: string): Promise<boolean>;
}

function toFlashcard(row: FlashcardRow): Flashcard {
  return {
    id: row.id,
    word: row.word,
    reading: row.reading,
    meaning: row.meaning,
    mnemonic: row.mnemonic,
    source: row.source,
    reviewInterval: row.reviewInterval,
    nextReviewDate: row.nextReviewAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export function createFlashcardRepository(db: Database): FlashcardRepository {
  const owned = (userId: string, id: string) =>
    and(eq(flashcard.id, id), eq(flashcard.userId, userId));

  return {
    async insertMany(userId, cards) {
      if (cards.length === 0) return [];
      const schedule = initialSchedule();
      const rows = await db
        .insert(flashcard)
        .values(cards.map((card) => ({ ...card, ...schedule, userId })))
        .returning();
      return rows.map(toFlashcard);
    },

    async listForUser(userId) {
      const rows = await db
        .select()
        .from(flashcard)
        .where(eq(flashcard.userId, userId))
        .orderBy(desc(flashcard.createdAt), flashcard.word);
      return rows.map(toFlashcard);
    },

    async recordReview(userId, id, remembered) {
      // Lock the row so two quick reviews of the same card can't both read the old interval.
      return db.transaction(async (tx) => {
        const [current] = await tx
          .select({ reviewInterval: flashcard.reviewInterval })
          .from(flashcard)
          .where(owned(userId, id))
          .for('update');
        if (!current) return null;

        const [updated] = await tx
          .update(flashcard)
          .set(scheduleReview(current.reviewInterval, remembered))
          .where(owned(userId, id))
          .returning();
        return updated ? toFlashcard(updated) : null;
      });
    },

    async deleteForUser(userId, id) {
      const deleted = await db
        .delete(flashcard)
        .where(owned(userId, id))
        .returning({ id: flashcard.id });
      return deleted.length > 0;
    },
  };
}
