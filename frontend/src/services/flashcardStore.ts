import {
  collection,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  runTransaction,
} from 'firebase/firestore';
import { firebaseApp } from '../lib/firebase';
import { scheduleReview, type ReviewSchedule } from '../lib/spacedRepetition';
import { flattenBatch, type Flashcard, type StoredFlashcard } from '../types/flashcard';

// Initialized here rather than in lib/firebase so the Firestore SDK is only loaded
// with the dashboard.
const db = getFirestore(firebaseApp);

// Cards are stored in batches: each document under users/{uid}/mnemonics holds the
// `flashcards` and `relatedWords` arrays from one generation request.
const batchesOf = (uid: string) => collection(db, 'users', uid, 'mnemonics');

/** Loads every card for the user, newest batch first. */
export async function fetchFlashcards(uid: string): Promise<Flashcard[]> {
  const snapshot = await getDocs(query(batchesOf(uid), orderBy('createdAt', 'desc')));
  return snapshot.docs.flatMap((batch) => flattenBatch(batch.id, batch.data()));
}

/**
 * Replaces (or removes, when `update` returns null) one card inside its batch.
 * Runs in a transaction because the whole array is rewritten, so concurrent edits to
 * cards in the same batch would otherwise overwrite each other.
 */
async function updateCard<T>(
  uid: string,
  card: Pick<Flashcard, 'id' | 'docId' | 'group'>,
  update: (stored: StoredFlashcard) => { next: StoredFlashcard | null; result: T },
): Promise<T> {
  const ref = doc(batchesOf(uid), card.docId);

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    const cards = (snapshot.data()?.[card.group] ?? []) as StoredFlashcard[];
    const index = cards.findIndex((stored) => stored.id === card.id);
    if (index === -1) throw new Error('This flashcard no longer exists.');

    const { next, result } = update(cards[index]!);
    const updated = next ? cards.with(index, next) : cards.toSpliced(index, 1);
    transaction.update(ref, { [card.group]: updated });
    return result;
  });
}

/** Records a review and returns the card's new schedule. */
export function recordReview(
  uid: string,
  card: Flashcard,
  remembered: boolean,
): Promise<ReviewSchedule> {
  return updateCard(uid, card, (stored) => {
    const schedule = scheduleReview(stored, remembered);
    return { next: { ...stored, ...schedule }, result: schedule };
  });
}

export function deleteFlashcard(uid: string, card: Flashcard): Promise<void> {
  return updateCard(uid, card, () => ({ next: null, result: undefined }));
}
