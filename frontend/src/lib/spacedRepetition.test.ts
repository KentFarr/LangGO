import { describe, expect, it } from 'vitest';
import { isDue, nextInterval, scheduleReview } from './spacedRepetition';

describe('nextInterval', () => {
  it.each([
    [1, true, 2],
    [4, true, 8],
    [8, false, 4],
    [1, false, 1],
    [3, false, 1],
  ])('interval %i, remembered=%s -> %i', (current, remembered, expected) => {
    expect(nextInterval(current, remembered)).toBe(expected);
  });

  it('treats missing or invalid intervals as the minimum', () => {
    expect(nextInterval(Number.NaN, true)).toBe(2);
    expect(nextInterval(0, false)).toBe(1);
  });
});

describe('scheduleReview', () => {
  it('moves the next review date forward by the new interval', () => {
    const now = new Date('2026-03-10T09:00:00.000Z');
    expect(scheduleReview({ reviewInterval: 2 }, true, now)).toEqual({
      reviewInterval: 4,
      nextReviewDate: '2026-03-14T09:00:00.000Z',
    });
  });
});

describe('isDue', () => {
  const now = new Date('2026-03-10T09:00:00.000Z');

  it('is due when the review date has passed', () => {
    expect(isDue({ nextReviewDate: '2026-03-10T08:59:59.000Z' }, now)).toBe(true);
    expect(isDue({ nextReviewDate: now.toISOString() }, now)).toBe(true);
  });

  it('is not due when the review date is in the future', () => {
    expect(isDue({ nextReviewDate: '2026-03-11T00:00:00.000Z' }, now)).toBe(false);
  });
});
