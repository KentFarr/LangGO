export const MIN_INTERVAL_DAYS = 1;

export interface ReviewSchedule {
  reviewInterval: number;
  nextReviewDate: string;
}

/** Doubles the interval when the card was remembered, halves it (minimum one day) when not. */
export function nextInterval(currentInterval: number, remembered: boolean): number {
  const current =
    Number.isFinite(currentInterval) && currentInterval >= MIN_INTERVAL_DAYS
      ? currentInterval
      : MIN_INTERVAL_DAYS;
  return remembered ? current * 2 : Math.max(MIN_INTERVAL_DAYS, Math.floor(current / 2));
}

export function scheduleReview(
  card: Pick<ReviewSchedule, 'reviewInterval'>,
  remembered: boolean,
  now: Date = new Date(),
): ReviewSchedule {
  const reviewInterval = nextInterval(card.reviewInterval, remembered);
  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(nextReviewDate.getDate() + reviewInterval);
  return { reviewInterval, nextReviewDate: nextReviewDate.toISOString() };
}

export function isDue(card: Pick<ReviewSchedule, 'nextReviewDate'>, now: Date): boolean {
  return new Date(card.nextReviewDate) <= now;
}
