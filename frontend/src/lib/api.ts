import type { GeneratedBatch } from '../types/flashcard';
import { auth } from './firebase';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Asks the backend to generate mnemonic flashcards; the backend also saves them for the user. */
export async function generateFlashcards(words: string[]): Promise<GeneratedBatch> {
  const user = auth.currentUser;
  if (!user) throw new ApiError('You need to be signed in to generate flashcards.', 401);

  const response = await fetch('/api/flashcards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await user.getIdToken()}`,
    },
    body: JSON.stringify({ words }),
  });

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }
  return body as GeneratedBatch;
}
