/** A card as produced by the language model, before review scheduling is attached. */
export interface GeneratedCard {
  word: string;
  reading: string;
  meaning: string;
  mnemonic: string;
}

export type FlashcardSource = 'requested' | 'related';

/** A card as returned by the API. */
export interface Flashcard extends GeneratedCard {
  id: string;
  source: FlashcardSource;
  /** JLPT level (5 = N5 … 1 = N1), or null if unknown. */
  level: number | null;
  /** Days until the next review. */
  reviewInterval: number;
  /** ISO-8601 timestamp of the next scheduled review. */
  nextReviewDate: string;
  createdAt: string;
}

export interface ReviewSchedule {
  reviewInterval: number;
  nextReviewAt: Date;
}

export const MIN_INTERVAL_DAYS = 1;

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Schedule for a brand-new card: first review one day out. */
export function initialSchedule(now: Date = new Date()): ReviewSchedule {
  return { reviewInterval: MIN_INTERVAL_DAYS, nextReviewAt: addDays(now, MIN_INTERVAL_DAYS) };
}

/** Doubles the interval when the card was remembered, halves it (minimum one day) when not. */
export function nextInterval(currentInterval: number, remembered: boolean): number {
  const current =
    Number.isFinite(currentInterval) && currentInterval >= MIN_INTERVAL_DAYS
      ? currentInterval
      : MIN_INTERVAL_DAYS;
  return remembered ? current * 2 : Math.max(MIN_INTERVAL_DAYS, Math.floor(current / 2));
}

export function scheduleReview(
  currentInterval: number,
  remembered: boolean,
  now: Date = new Date(),
): ReviewSchedule {
  const reviewInterval = nextInterval(currentInterval, remembered);
  return { reviewInterval, nextReviewAt: addDays(now, reviewInterval) };
}
