import { describe, expect, it } from 'vitest';
import { addDays, createFlashcard } from '../src/domain/flashcard.js';
import { buildPrompt, RELATED_WORD_COUNT } from '../src/services/mnemonicGenerator.js';

describe('createFlashcard', () => {
  it('schedules the first review one day out', () => {
    const now = new Date('2026-01-31T12:00:00.000Z');
    const card = createFlashcard(
      { word: '勉強', reading: 'べんきょう', meaning: 'study', mnemonic: 'Ben kyo studies' },
      now,
      'card-1',
    );

    expect(card).toEqual({
      word: '勉強',
      reading: 'べんきょう',
      meaning: 'study',
      mnemonic: 'Ben kyo studies',
      id: 'card-1',
      reviewInterval: 1,
      nextReviewDate: '2026-02-01T12:00:00.000Z',
    });
  });
});

describe('addDays', () => {
  it('does not mutate its input', () => {
    const date = new Date('2026-01-01T00:00:00.000Z');
    addDays(date, 3);
    expect(date.toISOString()).toBe('2026-01-01T00:00:00.000Z');
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
