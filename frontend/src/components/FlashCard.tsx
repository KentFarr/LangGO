// FlashcardComponent.tsx
import React from 'react';


interface FlashcardComponentProps {
  topWords: string[];
  mnemonics: string[];
  additionalWords: string[];
}

const FlashcardComponent: React.FC<FlashcardComponentProps> = ({ topWords, mnemonics, additionalWords }) => {
  const flashcards = topWords.map((word, index) => ({
    word,
    mnemonic: mnemonics[index] || 'No mnemonic available',
  }));

  additionalWords.forEach((word) => {
    flashcards.push({ word, mnemonic: 'No mnemonic available' });
  });
  console.log("Top Words:", topWords);
  console.log("Mnemonics:", mnemonics);
  console.log("Additional Words:", additionalWords);
  
  return (
    <div>
      <h1>Flashcards</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {flashcards.map((flashcard, index) => (
          <div
            key={index}
            style={{
              border: '1px solid #ccc',
              padding: '1rem',
              borderRadius: '8px',
              width: '200px',
              textAlign: 'center',
            }}
          >
            <h3>{flashcard.word}</h3>
            <p>{flashcard.mnemonic}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlashcardComponent;



