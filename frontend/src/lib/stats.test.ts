import { describe, expect, it } from 'vitest';
import type { Flashcard } from '../types/flashcard';
import { computeStats, dueCards, formatTimeUntil, MASTERED_INTERVAL_DAYS } from './stats';

const now = new Date('2026-05-01T12:00:00.000Z');
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600_000).toISOString();

const card = (id: string, overrides: Partial<Flashcard> = {}): Flashcard => ({
  id,
  word: id,
  reading: '',
  meaning: '',
  mnemonic: '',
  source: 'requested',
  level: 5,
  reviewInterval: 1,
  nextReviewDate: hoursFromNow(-1),
  createdAt: now.toISOString(),
  ...overrides,
});

describe('computeStats', () => {
  const cards = [
    card('due-1'),
    card('due-2', { level: 3, nextReviewDate: hoursFromNow(-48) }),
    card('soon', { level: 1, nextReviewDate: hoursFromNow(5) }),
    card('later', { level: null, nextReviewDate: hoursFromNow(72), reviewInterval: MASTERED_INTERVAL_DAYS }),
  ];

  it('counts due, soon, mastered, and levels', () => {
    const stats = computeStats(cards, now);
    expect(stats).toMatchObject({ total: 4, dueNow: 2, dueSoon: 1, mastered: 1, unknownLevel: 1 });
    expect(stats.byLevel).toEqual({ 1: 1, 2: 0, 3: 1, 4: 0, 5: 1 });
    expect(stats.nextDueAt?.toISOString()).toBe(hoursFromNow(5));
  });

  it('handles an empty deck', () => {
    expect(computeStats([], now)).toMatchObject({ total: 0, dueNow: 0, nextDueAt: null });
  });

  it('orders the review queue oldest-due first', () => {
    expect(dueCards(cards, now).map((c) => c.id)).toEqual(['due-2', 'due-1']);
  });
});

describe('formatTimeUntil', () => {
  it.each([
    [0.25, 'in 15 min'],
    [1, 'in 1 hour'],
    [5, 'in 5 hours'],
    [24, 'in 1 day'],
    [72, 'in 3 days'],
  ])('%s hours → %s', (hours, expected) => {
    expect(formatTimeUntil(new Date(hoursFromNow(hours)), now)).toBe(expected);
  });
});
