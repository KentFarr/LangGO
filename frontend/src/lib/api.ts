import type { Flashcard } from '../types/flashcard';
import type { JlptLevel } from './words';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Calls the API; the session cookie is sent automatically because requests are same-origin. */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });

  if (response.status === 204) return undefined as T;
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }
  return body as T;
}

export interface AppMeta {
  /** True when the server has no OpenAI key and serves sample flashcards. */
  demoMode: boolean;
  /** Words with complete sample cards, by JLPT level (demo mode only). */
  sampleWords: Record<JlptLevel, string[]> | null;
}

export function fetchMeta(): Promise<AppMeta> {
  return request<AppMeta>('/api/meta');
}

export async function fetchFlashcards(): Promise<Flashcard[]> {
  return (await request<{ flashcards: Flashcard[] }>('/api/flashcards')).flashcards;
}

/** Generates mnemonic flashcards for the words; the API saves them and returns the new cards. */
export async function generateFlashcards(words: string[], level?: JlptLevel): Promise<Flashcard[]> {
  const body = await request<{ flashcards: Flashcard[] }>('/api/flashcards', {
    method: 'POST',
    body: JSON.stringify({ words, level }),
  });
  return body.flashcards;
}

/** Records a review and returns the card with its new schedule. */
export async function reviewFlashcard(id: string, remembered: boolean): Promise<Flashcard> {
  const body = await request<{ flashcard: Flashcard }>(
    `/api/flashcards/${encodeURIComponent(id)}/review`,
    { method: 'POST', body: JSON.stringify({ remembered }) },
  );
  return body.flashcard;
}

export function deleteFlashcard(id: string): Promise<void> {
  return request(`/api/flashcards/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
