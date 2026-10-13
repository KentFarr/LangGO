import { createContext, useContext } from 'react';
import type { useFlashcards } from '../hooks/useFlashcards';
import type { AppMeta } from '../lib/api';

export type FlashcardsState = ReturnType<typeof useFlashcards> & {
  /** Server info (demo mode); null until loaded or if it failed to load. */
  meta: AppMeta | null;
};

export const FlashcardsContext = createContext<FlashcardsState | null>(null);

/** The signed-in user's cards, shared by every page inside the app shell. */
export function useDeck(): FlashcardsState {
  const state = useContext(FlashcardsContext);
  if (!state) throw new Error('useDeck must be used inside <FlashcardsProvider>');
  return state;
}
