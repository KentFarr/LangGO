import { describe, expect, it } from 'vitest';
import { addDays, initialSchedule, nextInterval, scheduleReview } from '../src/domain/flashcard.js';
import { buildPrompt, RELATED_WORD_COUNT } from '../src/services/mnemonicGenerator.js';

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

  it('treats invalid intervals as the minimum', () => {
    expect(nextInterval(Number.NaN, true)).toBe(2);
    expect(nextInterval(0, false)).toBe(1);
  });
});

describe('scheduling', () => {
  const now = new Date('2026-01-31T12:00:00.000Z');

  it('schedules a new card one day out', () => {
    expect(initialSchedule(now)).toEqual({
      reviewInterval: 1,
      nextReviewAt: new Date('2026-02-01T12:00:00.000Z'),
    });
  });

  it('moves the next review forward by the new interval', () => {
    expect(scheduleReview(2, true, now)).toEqual({
      reviewInterval: 4,
      nextReviewAt: new Date('2026-02-04T12:00:00.000Z'),
    });
  });

  it('addDays does not mutate its input', () => {
    addDays(now, 3);
    expect(now.toISOString()).toBe('2026-01-31T12:00:00.000Z');
  });
});

describe('buildPrompt', () => {
  it('asks for every requested word plus related words', () => {
    const prompt = buildPrompt(['勉強', '学校', '先生']);
    expect(prompt).toContain('these 3 words');
    expect(prompt).toContain('勉強、学校、先生');
    expect(prompt).toContain(`${RELATED_WORD_COUNT} additional related words`);
  });
});
