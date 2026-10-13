import { useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { FaTrash } from 'react-icons/fa6';
import type { Flashcard } from '../types/flashcard';
import FlashcardGrid from './FlashcardGrid';

interface FlashcardLibraryProps {
  cards: readonly Flashcard[];
  onDelete: (card: Flashcard) => Promise<void>;
}

export default function FlashcardLibrary({ cards, onDelete }: FlashcardLibraryProps) {
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (card: Flashcard) => {
    if (!window.confirm(`Delete the flashcard for ${card.word}?`)) return;
    setError(null);
    try {
      await onDelete(card);
    } catch (err) {
      console.error('Failed to delete flashcard', err);
      setError('Could not delete the flashcard. Please try again.');
    }
  };

  return (
    <section aria-labelledby="library-heading">
      <div className="text-center">
        <h2 id="library-heading" className="h3 mb-3">
          All flashcards ({cards.length})
        </h2>
        <Button
          variant="outline-primary"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls="library-cards"
        >
          {expanded ? 'Hide flashcards' : 'Show flashcards'}
        </Button>
      </div>

      {expanded && (
        <div id="library-cards" className="mt-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {cards.length === 0 ? (
            <Alert variant="info" className="text-center">
              No flashcards yet. Generate some above to get started.
            </Alert>
          ) : (
            <FlashcardGrid
              cards={cards}
              renderActions={(card) => (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDelete(card)}
                  aria-label={`Delete ${card.word}`}
                >
                  <FaTrash aria-hidden className="me-1" /> Delete
                </Button>
              )}
            />
          )}
        </div>
      )}
    </section>
  );
}
