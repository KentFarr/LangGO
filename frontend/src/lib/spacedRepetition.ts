// Scheduling itself happens on the server (backend/src/domain/flashcard.ts); the client
// only needs to know which cards are due.

export function isDue(card: { nextReviewDate: string }, now: Date): boolean {
  return new Date(card.nextReviewDate) <= now;
}
