import type { ReactNode } from 'react';
import { Col, Row } from 'react-bootstrap';
import styled from 'styled-components';
import { colors } from '../theme';
import type { StoredFlashcard } from '../types/flashcard';
import FlipCard from './FlipCard';

const Word = styled.p`
  margin: 0;
  font-size: 2.25rem;
  font-weight: 600;
  color: ${colors.primary};
`;

const Hint = styled.p`
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.6;
`;

const Reading = styled.p`
  margin: 0;
  font-size: 1.25rem;
  color: ${colors.primary};
`;

const Meaning = styled.p`
  margin: 0;
  font-weight: 600;
`;

const Mnemonic = styled.p`
  margin: 0;
  font-size: 1rem;
`;

interface FlashcardGridProps<T extends StoredFlashcard> {
  cards: readonly T[];
  renderActions?: (card: T, flipped: boolean) => ReactNode;
}

export default function FlashcardGrid<T extends StoredFlashcard>({
  cards,
  renderActions,
}: FlashcardGridProps<T>) {
  return (
    <Row className="g-4">
      {cards.map((card) => (
        <Col key={card.id} xs={12} sm={6} lg={4}>
          <FlipCard
            label={card.word}
            front={
              <>
                <Word lang="ja">{card.word}</Word>
                <Hint>Click to reveal</Hint>
              </>
            }
            back={
              <>
                {card.reading && <Reading lang="ja">{card.reading}</Reading>}
                {card.meaning && <Meaning>{card.meaning}</Meaning>}
                <Mnemonic>{card.mnemonic}</Mnemonic>
              </>
            }
            actions={renderActions && ((flipped) => renderActions(card, flipped))}
          />
        </Col>
      ))}
    </Row>
  );
}
