import { useState } from 'react';
import { Alert, Badge, Button } from 'react-bootstrap';
import { FaThumbsDown, FaThumbsUp } from 'react-icons/fa6';
import { isDue } from '../lib/spacedRepetition';
import type { Flashcard } from '../types/flashcard';
import FlashcardGrid from './FlashcardGrid';

interface ReviewSectionProps {
  cards: readonly Flashcard[];
  onReview: (card: Flashcard, remembered: boolean) => Promise<void>;
}

export default function ReviewSection({ cards, onReview }: ReviewSectionProps) {
  // Fixed for the session so reviewed cards (now due in the future) drop out of the list.
  const [now] = useState(() => new Date());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dueCards = cards.filter((card) => isDue(card, now));

  const handleReview = async (card: Flashcard, remembered: boolean) => {
    setPendingId(card.id);
    setError(null);
    try {
      await onReview(card, remembered);
    } catch (err) {
      console.error('Failed to record review', err);
      setError('Could not save your review. Please try again.');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <section aria-labelledby="review-heading">
      <h2 id="review-heading" className="h3 text-center mb-4">
        Due for review <Badge bg="secondary">{dueCards.length}</Badge>
      </h2>

      {error && <Alert variant="danger">{error}</Alert>}

      {dueCards.length === 0 ? (
        <Alert variant="info" className="text-center">
          You&apos;re all caught up! No flashcards are due for review.
        </Alert>
      ) : (
        <FlashcardGrid
          cards={dueCards}
          renderActions={(card, flipped) => {
            const disabled = !flipped || pendingId === card.id;
            return (
              <>
                <Button
                  variant="primary"
                  disabled={disabled}
                  onClick={() => handleReview(card, true)}
                >
                  <FaThumbsUp aria-hidden className="me-2" />I remembered
                </Button>
                <Button
                  variant="warning"
                  disabled={disabled}
                  onClick={() => handleReview(card, false)}
                >
                  <FaThumbsDown aria-hidden className="me-2" />I forgot
                </Button>
              </>
            );
          }}
        />
      )}
    </section>
  );
}
