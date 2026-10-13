import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useFlashcards } from '../hooks/useFlashcards';
import { fetchMeta, type AppMeta } from '../lib/api';
import { FlashcardsContext } from './context';

/** Loads the deck and server info once for all signed-in pages. */
export default function FlashcardsProvider({ children }: { children: ReactNode }) {
  const { cards, status, review, remove, addCards } = useFlashcards();
  const [meta, setMeta] = useState<AppMeta | null>(null);

  useEffect(() => {
    fetchMeta().then(setMeta, (error: unknown) => console.error('Failed to load app info', error));
  }, []);

  const value = useMemo(
    () => ({ cards, status, review, remove, addCards, meta }),
    [cards, status, review, remove, addCards, meta],
  );
  return <FlashcardsContext value={value}>{children}</FlashcardsContext>;
}
