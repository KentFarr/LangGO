import { describe, expect, it } from 'vitest';
import { countOccurrences, loadWordsForLevel, sampleWords, topWords } from './words';

describe('countOccurrences', () => {
  it('finds words inside unspaced Japanese text', () => {
    const text = '私は毎日学校で勉強します。勉強は楽しいです。';
    const counts = countOccurrences(text, ['勉強', '学校', '先生']);

    expect(counts).toEqual(
      new Map([
        ['勉強', 2],
        ['学校', 1],
      ]),
    );
  });

  it('ignores whitespace that PDF extraction inserts mid-word', () => {
    expect(countOccurrences('勉 強\nして', ['勉強']).get('勉強')).toBe(1);
  });

  it('does not double count overlapping matches', () => {
    expect(countOccurrences('ああああ', ['ああ']).get('ああ')).toBe(2);
  });
});

describe('topWords', () => {
  it('orders by frequency, then by word length', () => {
    const counts = new Map([
      ['人', 3],
      ['学校', 5],
      ['先生', 3],
    ]);
    expect(topWords(counts, 2)).toEqual(['学校', '先生']);
  });
});

describe('sampleWords', () => {
  it('returns the requested number of distinct words', () => {
    const words = ['a', 'b', 'c', 'd', 'e'];
    const sample = sampleWords(words, 3);

    expect(sample).toHaveLength(3);
    expect(new Set(sample).size).toBe(3);
    sample.forEach((word) => expect(words).toContain(word));
  });

  it('does not mutate the input and caps at the input size', () => {
    const words = ['a', 'b'];
    expect(sampleWords(words, 10, () => 0.99)).toHaveLength(2);
    expect(words).toEqual(['a', 'b']);
  });
});

describe('loadWordsForLevel', () => {
  it('loads a de-duplicated list for a level', async () => {
    const words = await loadWordsForLevel(5);
    expect(words.length).toBeGreaterThan(100);
    expect(new Set(words).size).toBe(words.length);
  });
});
