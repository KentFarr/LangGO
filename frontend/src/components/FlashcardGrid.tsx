import clsx from 'clsx';
import type { ReactNode } from 'react';
import type { Flashcard } from '../types/flashcard';
import { CardBack, CardFront } from './FlashcardFaces';
import FlipCard from './FlipCard';

interface FlashcardGridProps<T extends Flashcard> {
  cards: readonly T[];
  renderActions?: (card: T, flipped: boolean) => ReactNode;
  /** Maximum columns on wide screens. */
  columns?: 2 | 3;
}

export default function FlashcardGrid<T extends Flashcard>({
  cards,
  renderActions,
  columns = 3,
}: FlashcardGridProps<T>) {
  return (
    <ul className={clsx('grid gap-5 sm:grid-cols-2', columns === 3 && 'lg:grid-cols-3')}>
      {cards.map((card) => (
        <li key={card.id}>
          <FlipCard
            label={card.word}
            front={<CardFront card={card} />}
            back={<CardBack card={card} />}
            actions={renderActions && ((flipped) => renderActions(card, flipped))}
          />
        </li>
      ))}
    </ul>
  );
}
