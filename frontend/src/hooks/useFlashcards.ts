import { useCallback, useEffect, useState } from 'react';
import { deleteFlashcard, fetchFlashcards, reviewFlashcard } from '../lib/api';
import type { Flashcard } from '../types/flashcard';

type Status = 'loading' | 'ready' | 'error';

/** Loads the user's cards once and keeps local state in sync with every write. */
export function useFlashcards() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
    fetchFlashcards().then(
      (loaded) => {
        if (cancelled) return;
        setCards(loaded);
        setStatus('ready');
      },
      (error: unknown) => {
        if (cancelled) return;
        console.error('Failed to load flashcards', error);
        setStatus('error');
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const review = useCallback(async (card: Flashcard, remembered: boolean) => {
    const updated = await reviewFlashcard(card.id, remembered);
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  const remove = useCallback(async (card: Flashcard) => {
    await deleteFlashcard(card.id);
    setCards((prev) => prev.filter((c) => c.id !== card.id));
  }, []);

  const addCards = useCallback((created: Flashcard[]) => {
    setCards((prev) => [...created, ...prev]);
  }, []);

  return { cards, status, review, remove, addCards };
}
