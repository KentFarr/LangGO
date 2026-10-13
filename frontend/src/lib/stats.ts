import type { Flashcard } from '../types/flashcard';
import { isDue } from './spacedRepetition';
import type { JlptLevel } from './words';

/** A card whose review interval has grown this long is counted as learned. */
export const MASTERED_INTERVAL_DAYS = 16;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DeckStats {
  total: number;
  dueNow: number;
  /** Not due yet, but due within the next 24 hours. */
  dueSoon: number;
  mastered: number;
  byLevel: Record<JlptLevel, number>;
  /** Cards created before levels were recorded. */
  unknownLevel: number;
  /** When the next not-yet-due card becomes due, if any. */
  nextDueAt: Date | null;
}

export function computeStats(cards: readonly Flashcard[], now: Date): DeckStats {
  const stats: DeckStats = {
    total: cards.length,
    dueNow: 0,
    dueSoon: 0,
    mastered: 0,
    byLevel: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    unknownLevel: 0,
    nextDueAt: null,
  };

  for (const card of cards) {
    const dueAt = new Date(card.nextReviewDate);
    if (isDue(card, now)) {
      stats.dueNow++;
    } else {
      if (dueAt.getTime() - now.getTime() <= DAY_MS) stats.dueSoon++;
      if (!stats.nextDueAt || dueAt < stats.nextDueAt) stats.nextDueAt = dueAt;
    }
    if (card.reviewInterval >= MASTERED_INTERVAL_DAYS) stats.mastered++;
    if (card.level && card.level >= 1 && card.level <= 5) stats.byLevel[card.level as JlptLevel]++;
    else stats.unknownLevel++;
  }
  return stats;
}

/** Due cards, oldest due first, as the queue for a review session. */
export function dueCards(cards: readonly Flashcard[], now: Date): Flashcard[] {
  return cards
    .filter((card) => isDue(card, now))
    .sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate));
}

/** "in 3 hours", "in 2 days": coarse, friendly time until a date. */
export function formatTimeUntil(date: Date, now: Date): string {
  const minutes = Math.max(1, Math.round((date.getTime() - now.getTime()) / 60000));
  if (minutes < 60) return `in ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `in ${hours} hour${hours === 1 ? '' : 's'}`;
  const days = Math.round(hours / 24);
  return `in ${days} day${days === 1 ? '' : 's'}`;
}
