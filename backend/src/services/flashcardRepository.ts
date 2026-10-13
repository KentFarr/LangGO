import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { FlashcardBatch } from '../domain/flashcard.js';

export interface FlashcardRepository {
  /** Persists a generated batch for the user and returns the new document id. */
  saveBatch(uid: string, batch: FlashcardBatch): Promise<string>;
}

export function createFirestoreFlashcardRepository(db: Firestore): FlashcardRepository {
  return {
    async saveBatch(uid, batch) {
      const ref = await db
        .collection('users')
        .doc(uid)
        .collection('mnemonics')
        .add({ ...batch, createdAt: FieldValue.serverTimestamp() });
      return ref.id;
    },
  };
}
