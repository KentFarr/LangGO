import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../lib/api';
import type { Flashcard } from '../types/flashcard';
import { useFlashcards } from './useFlashcards';

vi.mock('../lib/api');

const card = (id: string, overrides: Partial<Flashcard> = {}): Flashcard => ({
  id,
  word: `word-${id}`,
  reading: 'よみ',
  meaning: 'meaning',
  mnemonic: 'mnemonic',
  source: 'requested',
  level: 5,
  reviewInterval: 1,
  nextReviewDate: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('useFlashcards', () => {
  beforeEach(() => {
    vi.mocked(api.fetchFlashcards).mockResolvedValue([card('a'), card('b')]);
  });

  it('loads cards', async () => {
    const { result } = renderHook(() => useFlashcards());
    expect(result.current.status).toBe('loading');

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.cards.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('reports load errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(api.fetchFlashcards).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useFlashcards());

    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('replaces a reviewed card with the server’s version', async () => {
    const reviewed = card('a', { reviewInterval: 2, nextReviewDate: '2026-01-03T00:00:00.000Z' });
    vi.mocked(api.reviewFlashcard).mockResolvedValue(reviewed);
    const { result } = renderHook(() => useFlashcards());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(() => result.current.review(result.current.cards[0]!, true));

    expect(api.reviewFlashcard).toHaveBeenCalledWith('a', true);
    expect(result.current.cards[0]).toEqual(reviewed);
  });

  it('removes deleted cards and prepends generated ones', async () => {
    vi.mocked(api.deleteFlashcard).mockResolvedValue();
    const { result } = renderHook(() => useFlashcards());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(() => result.current.remove(result.current.cards[0]!));
    act(() => result.current.addCards([card('c')]));

    expect(result.current.cards.map((c) => c.id)).toEqual(['c', 'b']);
  });
});
