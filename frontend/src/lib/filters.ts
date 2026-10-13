import type { Flashcard, FlashcardSource } from '../types/flashcard';

export type LevelFilter = 'all' | number;
export type SourceFilter = 'all' | FlashcardSource;

/** Library filtering: level, source, and a case-insensitive search across the card text. */
export function filterCards(
  cards: readonly Flashcard[],
  { query, level, source }: { query: string; level: LevelFilter; source: SourceFilter },
): Flashcard[] {
  const needle = query.trim().toLowerCase();
  return cards.filter(
    (card) =>
      (level === 'all' || card.level === level) &&
      (source === 'all' || card.source === source) &&
      (!needle ||
        [card.word, card.reading, card.meaning, card.mnemonic].some((text) => text.toLowerCase().includes(needle))),
  );
}
