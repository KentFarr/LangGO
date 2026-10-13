import { describe, expect, it } from 'vitest';
import { isDue } from './spacedRepetition';

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
