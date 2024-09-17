// FlashCard.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { Container, Row, Col } from 'react-bootstrap';
import { FaTrash } from 'react-icons/fa';

// Updated Flashcard interface with optional properties
interface Flashcard {
  id?: string;
  docId?: string;
  word: string;
  mnemonic: string;
  type?: string;
}

interface FlashcardComponentProps {
  flashcards: Flashcard[];
  handleRemove?: (id: string, docId: string, type: string) => void;
}

const CardWrapper = styled.div`
  perspective: 1000px;
  width: 100%;
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;

  .inner-card {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.6s;
  }

  .inner-card.flipped {
    transform: rotateY(180deg);
  }
`;

const CardFace = styled.div<{ front?: boolean }>`
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  border-radius: 15px;
  background-color: ${({ front }) => (front ? '#ffffff' : '#f4f4f4')};
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  ${({ front }) =>
    !front &&
    `
      transform: rotateY(180deg);
    `}
`;

const CardTitle = styled.h5`
  font-size: 24px;
  color: #495e57;
  margin-bottom: 15px;
  text-align: center;
`;

const CardText = styled.p`
  font-size: 18px;
  color: #333;
  text-align: center;
`;

const RemoveButton = styled.button`
  background: transparent;
  border: none;
  color: #ff4d4d;
  cursor: pointer;
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  font-size: 1.5rem;

  &:hover {
    color: #ff1a1a;
  }
`;

const FlashcardComponent: React.FC<FlashcardComponentProps> = ({ flashcards, handleRemove }) => {
  const [flippedIds, setFlippedIds] = useState<string[]>([]);

  const handleFlip = (id: string | undefined, index: number) => {
    const cardId = id || index.toString();
    setFlippedIds((prevFlipped) =>
      prevFlipped.includes(cardId)
        ? prevFlipped.filter((flippedId) => flippedId !== cardId)
        : [...prevFlipped, cardId]
    );
  };

  return (
    <Container>
      <Row>
        {flashcards.map((flashcard, index) => {
          const cardId = flashcard.id || index.toString();
          return (
            <Col
              key={cardId}
              md={4}
              sm={6}
              xs={12}
              className="mb-4 d-flex justify-content-center"
            >
              <CardWrapper onClick={() => handleFlip(flashcard.id, index)}>
                <div
                  className={`inner-card ${
                    flippedIds.includes(cardId) ? 'flipped' : ''
                  }`}
                >
                  {/* Front side of the card */}
                  <CardFace front>
                    <CardTitle>{flashcard.word}</CardTitle>
                  </CardFace>

                  {/* Back side of the card */}
                  <CardFace>
                    {/* Conditionally render the Remove button */}
                    {handleRemove && flashcard.id && flashcard.docId && flashcard.type && (
                      <RemoveButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(flashcard.id!, flashcard.docId!, flashcard.type!);
                        }}
                      >
                        <FaTrash />
                      </RemoveButton>
                    )}
                    <CardText>{flashcard.mnemonic}</CardText>
                  </CardFace>
                </div>
              </CardWrapper>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
};

export default FlashcardComponent;
