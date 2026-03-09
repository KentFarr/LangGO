import { StoredFlashcard } from '../types/flashcards';

export interface ReviewUpdate {
  reviewInterval: number;
  nextReviewDate: string;
}

/**
 * Calculate the next review interval and date for a flashcard based on
 * whether the user successfully recalled it.
 */
export const getNextReviewSchedule = (
  current: Pick<StoredFlashcard, 'reviewInterval'>,
  success: boolean
): ReviewUpdate => {
  const currentInterval = current.reviewInterval || 1;
  const newReviewInterval = success
    ? currentInterval * 2
    : Math.max(currentInterval / 2, 1);

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newReviewInterval);

  return {
    reviewInterval: newReviewInterval,
    nextReviewDate: nextReviewDate.toISOString(),
  };
};

