import React from 'react';

interface Flashcard {
  word: string;
  mnemonic: string;
}

interface FlashcardComponentProps {
  flashcards: Flashcard[]; // Expect an array of objects with both word and mnemonic
}

const FlashcardComponent: React.FC<FlashcardComponentProps> = ({ flashcards }) => {
  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Flashcards</h1>
      <div className="row">
        {flashcards.map((flashcard, index) => (
          <div key={index} className="col-md-4 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">{flashcard.word}</h5>
                <p className="card-text">{flashcard.mnemonic}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlashcardComponent;
