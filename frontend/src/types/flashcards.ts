// Shared flashcard domain types

export type FlashcardType = 'flashcards' | 'relatedWords';

export interface FlashcardBase {
  word: string;
  mnemonic: string;
}

// Flashcard as stored in Firestore with scheduling metadata
export interface StoredFlashcard extends FlashcardBase {
  id: string;
  nextReviewDate: string; // ISO string
  reviewInterval: number;
  type: FlashcardType;
  docId: string;
}

// Flashcard shape returned from generation API before being persisted
export interface GeneratedFlashcard extends FlashcardBase {
  id?: string;
}

// UI-level flashcard that may or may not include storage metadata
export interface UiFlashcard extends FlashcardBase {
  id?: string;
  docId?: string;
  type?: FlashcardType;
}

