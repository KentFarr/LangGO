import type { JlptLevel } from './words';

export const MAX_LIST_WORDS = 100;
/** The API generates at most this many words per request. */
export const BATCH_SIZE = 20;

const JAPANESE = /[぀-ヿ㐀-鿿豈-﫿ｦ-ﾟ]/;

export interface ParsedWordList {
  words: string[];
  /** Tokens with no Japanese in them (e.g. English glosses), which were skipped. */
  ignored: string[];
  /** Words beyond MAX_LIST_WORDS that were dropped. */
  truncated: number;
}

/**
 * Splits pasted text into words. Accepts newlines, spaces, commas (、，,), slashes, bullets
 * and the like, drops parenthesized notes such as "勉強 (study)", and removes duplicates.
 */
export function parseWordList(input: string): ParsedWordList {
  const tokens = input
    .replace(/[（(【[][^）)】\]]*[）)】\]]/g, ' ')
    .split(/[\s,，、;；・/／|｜]+/)
    .map((token) => token.replace(/^[-*•\d.)\s]+|["'「」『』。.!?！？]/g, '').trim())
    .filter(Boolean);

  const words: string[] = [];
  const ignored: string[] = [];
  for (const token of tokens) {
    if (!JAPANESE.test(token)) ignored.push(token);
    else if (!words.includes(token)) words.push(token);
  }
  return {
    words: words.slice(0, MAX_LIST_WORDS),
    ignored,
    truncated: Math.max(0, words.length - MAX_LIST_WORDS),
  };
}

export interface WordBatch {
  level: JlptLevel | null;
  words: string[];
}

/**
 * Groups words by JLPT level (so each card is tagged correctly) and splits each group into
 * API-sized batches. Words not on any JLPT list form their own group.
 */
export function batchByLevel(words: readonly string[], levels: ReadonlyMap<string, JlptLevel>): WordBatch[] {
  const groups = new Map<JlptLevel | null, string[]>();
  for (const word of words) {
    const level = levels.get(word) ?? null;
    groups.set(level, [...(groups.get(level) ?? []), word]);
  }

  const order: (JlptLevel | null)[] = [5, 4, 3, 2, 1, null];
  return order.flatMap((level) => {
    const group = groups.get(level) ?? [];
    const batches: WordBatch[] = [];
    for (let i = 0; i < group.length; i += BATCH_SIZE) batches.push({ level, words: group.slice(i, i + BATCH_SIZE) });
    return batches;
  });
}
