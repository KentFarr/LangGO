import { describe, expect, it } from 'vitest';
import { batchByLevel, MAX_LIST_WORDS, parseWordList } from './wordList';
import type { JlptLevel } from './words';

describe('parseWordList', () => {
  it('accepts any common separator and removes duplicates', () => {
    const input = '勉強\n学校、先生, 電車　天気・旅行/約束 | 勉強';
    expect(parseWordList(input).words).toEqual(['勉強', '学校', '先生', '電車', '天気', '旅行', '約束']);
  });

  it('drops parenthesized notes, list markers and quotes, and reports non-Japanese tokens', () => {
    const result = parseWordList('1. 勉強 (study)\n- 「学校」\n• 先生（せんせい） teacher');
    expect(result.words).toEqual(['勉強', '学校', '先生']);
    expect(result.ignored).toEqual(['teacher']);
  });

  it('caps very long lists', () => {
    const many = Array.from({ length: MAX_LIST_WORDS + 5 }, (_, i) => `語${i}`).join('\n');
    const result = parseWordList(many);
    expect(result.words).toHaveLength(MAX_LIST_WORDS);
    expect(result.truncated).toBe(5);
  });
});

describe('batchByLevel', () => {
  const levels = new Map<string, JlptLevel>([
    ['学校', 5],
    ['先生', 5],
    ['環境', 3],
  ]);

  it('groups by level, easiest first, with unknown words last', () => {
    expect(batchByLevel(['環境', 'ラーメン', '学校', '先生'], levels)).toEqual([
      { level: 5, words: ['学校', '先生'] },
      { level: 3, words: ['環境'] },
      { level: null, words: ['ラーメン'] },
    ]);
  });

  it('splits large groups into batches of 20', () => {
    const words = Array.from({ length: 45 }, (_, i) => `語${i}`);
    expect(batchByLevel(words, new Map()).map((b) => b.words.length)).toEqual([20, 20, 5]);
  });
});
