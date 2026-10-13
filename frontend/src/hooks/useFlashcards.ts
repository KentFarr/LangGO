import { useCallback, useEffect, useState } from 'react';
import { deleteFlashcard, fetchFlashcards, recordReview } from '../services/flashcardStore';
import { flattenBatch, type Flashcard, type GeneratedBatch } from '../types/flashcard';

type Status = 'loading' | 'ready' | 'error';

/** Loads the user's cards once and keeps local state in sync with every write. */
export function useFlashcards(uid: string) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
    fetchFlashcards(uid).then(
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
  }, [uid]);

  const review = useCallback(
    async (card: Flashcard, remembered: boolean) => {
      const schedule = await recordReview(uid, card, remembered);
      setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, ...schedule } : c)));
    },
    [uid],
  );

  const remove = useCallback(
    async (card: Flashcard) => {
      await deleteFlashcard(uid, card);
      setCards((prev) => prev.filter((c) => c.id !== card.id));
    },
    [uid],
  );

  const addBatch = useCallback((batch: GeneratedBatch) => {
    setCards((prev) => [...flattenBatch(batch.docId, batch), ...prev]);
  }, []);

  return { cards, status, review, remove, addBatch };
}
