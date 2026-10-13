/** Whether the card was requested by the user or suggested alongside them by the model. */
export type FlashcardSource = 'requested' | 'related';

/** A flashcard as returned by the API. */
export interface Flashcard {
  id: string;
  word: string;
  /** Hiragana reading. */
  reading: string;
  /** English meaning. */
  meaning: string;
  mnemonic: string;
  source: FlashcardSource;
  /** Days until the next review. */
  reviewInterval: number;
  /** ISO-8601 timestamp of the next scheduled review. */
  nextReviewDate: string;
  createdAt: string;
}
