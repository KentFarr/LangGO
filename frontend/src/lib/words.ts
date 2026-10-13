export type JlptLevel = 1 | 2 | 3 | 4 | 5;

/** Easiest first, as shown in the level picker. */
export const JLPT_LEVELS: readonly JlptLevel[] = [5, 4, 3, 2, 1];

interface VocabularyEntry {
  word: string;
  difficulty: number;
}

// Each list is a few hundred KB, so only the selected level is downloaded.
const loaders: Record<JlptLevel, () => Promise<{ default: VocabularyEntry[] }>> = {
  1: () => import('../data/kanji_words_difficulty_1_n1.json'),
  2: () => import('../data/kanji_words_difficulty_2_n2.json'),
  3: () => import('../data/kanji_words_difficulty_3_n3.json'),
  4: () => import('../data/kanji_words_difficulty_4_n4.json'),
  5: () => import('../data/kanji_words_difficulty_5_n5.json'),
};

export async function loadWordsForLevel(level: JlptLevel): Promise<string[]> {
  const { default: entries } = await loaders[level]();
  return [...new Set(entries.map((entry) => entry.word))];
}

/**
 * Counts how often each vocabulary word appears in the text.
 *
 * Japanese has no spaces between words, so this does substring matching rather than
 * tokenizing. Whitespace is stripped first because PDF text extraction inserts breaks
 * in the middle of words. (One `indexOf` scan per word is fast: ~100 ms for the N3 list
 * over 700k characters, so even whole books are fine.)
 */
export function countOccurrences(text: string, words: readonly string[]): Map<string, number> {
  const haystack = text.replace(/\s+/g, '');
  const counts = new Map<string, number>();

  for (const word of words) {
    let count = 0;
    for (let i = haystack.indexOf(word); i !== -1; i = haystack.indexOf(word, i + word.length)) {
      count++;
    }
    if (count > 0) counts.set(word, count);
  }
  return counts;
}

/**
 * Maps every word in the JLPT lists to its level. A word listed at several levels gets the
 * easiest one, since that's when learners meet it.
 */
export async function loadLevelIndex(): Promise<Map<string, JlptLevel>> {
  const index = new Map<string, JlptLevel>();
  for (const level of [1, 2, 3, 4, 5] as const) {
    for (const word of await loadWordsForLevel(level)) index.set(word, level);
  }
  return index;
}

/** Most frequent words first; ties go to the longer (more specific) word. */
export function topWords(counts: ReadonlyMap<string, number>, limit: number): string[] {
  return [...counts]
    .sort(([wordA, countA], [wordB, countB]) => countB - countA || wordB.length - wordA.length)
    .slice(0, limit)
    .map(([word]) => word);
}

/** Uniform random sample without replacement (partial Fisher–Yates shuffle). */
export function sampleWords(
  words: readonly string[],
  limit: number,
  random: () => number = Math.random,
): string[] {
  const pool = [...words];
  const size = Math.min(limit, pool.length);
  for (let i = 0; i < size; i++) {
    const j = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, size);
}
