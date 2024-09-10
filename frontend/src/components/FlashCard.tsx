import React, { useState } from 'react';
import styled from 'styled-components';
import { Container, Row, Col } from 'react-bootstrap';

// Flashcard interface
interface Flashcard {
  word: string;
  mnemonic: string;
}

// Flashcard component props
interface FlashcardComponentProps {
  flashcards: Flashcard[];
}

// Styled Components for Flashcard with Flip Animation
const CardWrapper = styled.div`
  perspective: 1000px;
  width: 100%;
  height: 300px; /* Set a fixed height to prevent cards from overlapping */
  display: flex; /* Ensure the card takes up the full column space */
  justify-content: center; /* Center the card horizontally */
  align-items: center; /* Center the card vertically */

  .inner-card {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.6s;
  }

  .flipped {
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

const FlashcardComponent: React.FC<FlashcardComponentProps> = ({ flashcards }) => {
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);

  const handleFlip = (index: number) => {
    setFlippedIndices((prevFlipped) =>
      prevFlipped.includes(index)
        ? prevFlipped.filter((i) => i !== index)
        : [...prevFlipped, index]
    );
  };

  return (
    <Container>
      <Row>
        {flashcards.map((flashcard, index) => (
          <Col key={index} md={4} sm={6} xs={12} className="mb-4 d-flex justify-content-center">
            <CardWrapper onClick={() => handleFlip(index)}>
              <div className={`inner-card ${flippedIndices.includes(index) ? 'flipped' : ''}`}>
                {/* Front side of the card */}
                <CardFace front>
                  <CardTitle>{flashcard.word}</CardTitle>
                </CardFace>

                {/* Back side of the card */}
                <CardFace>
                  <CardText>{flashcard.mnemonic}</CardText>
                </CardFace>
              </div>
            </CardWrapper>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default FlashcardComponent;
