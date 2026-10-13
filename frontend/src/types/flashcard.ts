/** The two arrays a batch document stores cards in. */
export type FlashcardGroup = 'flashcards' | 'relatedWords';

export const FLASHCARD_GROUPS: readonly FlashcardGroup[] = ['flashcards', 'relatedWords'];

/** A card as stored inside a `users/{uid}/mnemonics/{docId}` batch document. */
export interface StoredFlashcard {
  id: string;
  word: string;
  mnemonic: string;
  /** Hiragana reading. Cards created before v2 embed it in the mnemonic instead. */
  reading?: string;
  /** English meaning. Cards created before v2 embed it in the mnemonic instead. */
  meaning?: string;
  /** Days until the next review. */
  reviewInterval: number;
  /** ISO-8601 timestamp of the next scheduled review. */
  nextReviewDate: string;
}

/** A stored card plus the location of the batch document that holds it. */
export interface Flashcard extends StoredFlashcard {
  docId: string;
  group: FlashcardGroup;
}

export interface GeneratedBatch {
  docId: string;
  flashcards: StoredFlashcard[];
  relatedWords: StoredFlashcard[];
}

export function flattenBatch(
  docId: string,
  batch: Partial<Record<FlashcardGroup, StoredFlashcard[]>>,
): Flashcard[] {
  return FLASHCARD_GROUPS.flatMap((group) =>
    (batch[group] ?? []).map((card) => ({ ...card, docId, group })),
  );
}
