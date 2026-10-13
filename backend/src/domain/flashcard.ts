import { randomUUID } from 'node:crypto';

/** A card as produced by the language model, before review scheduling is attached. */
export interface GeneratedCard {
  word: string;
  reading: string;
  meaning: string;
  mnemonic: string;
}

/** A card as stored in Firestore under `users/{uid}/mnemonics/{batchId}`. */
export interface Flashcard extends GeneratedCard {
  id: string;
  /** Days until the next review; doubles on success, halves (min 1) on failure. */
  reviewInterval: number;
  /** ISO-8601 timestamp of the next scheduled review. */
  nextReviewDate: string;
}

export interface FlashcardBatch {
  flashcards: Flashcard[];
  relatedWords: Flashcard[];
}

export const INITIAL_REVIEW_INTERVAL_DAYS = 1;

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function createFlashcard(
  card: GeneratedCard,
  now: Date = new Date(),
  id: string = randomUUID(),
): Flashcard {
  return {
    ...card,
    id,
    reviewInterval: INITIAL_REVIEW_INTERVAL_DAYS,
    nextReviewDate: addDays(now, INITIAL_REVIEW_INTERVAL_DAYS).toISOString(),
  };
}
