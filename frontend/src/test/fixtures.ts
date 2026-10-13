import { vi } from 'vitest';
import type { FlashcardsState } from '../flashcards/context';
import type { Flashcard } from '../types/flashcard';

export const card = (id: string, overrides: Partial<Flashcard> = {}): Flashcard => ({
  id,
  word: `word-${id}`,
  reading: 'よみ',
  meaning: `meaning-${id}`,
  mnemonic: 'mnemonic',
  source: 'requested',
  level: 5,
  reviewInterval: 1,
  nextReviewDate: '2020-01-01T00:00:00.000Z',
  createdAt: '2020-01-01T00:00:00.000Z',
  ...overrides,
});

export function deckState(overrides: Partial<FlashcardsState> = {}): FlashcardsState {
  return {
    cards: [],
    status: 'ready',
    review: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
    addCards: vi.fn(),
    meta: { demoMode: false, sampleWords: null },
    ...overrides,
  };
}
