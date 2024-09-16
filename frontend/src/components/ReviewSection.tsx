import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faThumbsDown } from '@fortawesome/free-solid-svg-icons';

interface Flashcard {
  id: string;
  word: string;
  mnemonic: string;
  nextReviewDate: string;
  reviewInterval: number;
  type: string;  // To identify if it's from 'flashcards' or 'relatedWords'
}

const CardWrapper = styled.div`
  perspective: 1000px;
  width: 100%;
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;

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

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 20px;

  button {
    width: 45%;  /* Adjust the width for better text fit */
    padding: 10px 20px;  /* Add padding for more space */
    font-size: 16px;  /* Font size for better readability */
    text-align: center;  /* Center the text */
    border-radius: 8px;  /* Rounded corners for a modern look */
    border: none;  /* Remove default border */
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s ease;  /* Smooth transition for hover effects */
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);  /* Light shadow for depth */
    
    &.remembered {
      background-color: #495E57;  /* Dark green for "I Remembered" */
      color: #F5F7F8;  /* Light text for contrast */
      
      &:hover {
        background-color: #6b8f71;  /* Brighter green on hover */
        box-shadow: 0 0 10px 2px #6b8f71;  /* Glow effect */
      }
    }
    
    &.forgot {
      background-color: #F4CE14;  /* Bright yellow for "I Forgot" */
      color: #45474B;  /* Dark text for contrast */
      
      &:hover {
        background-color: #FFD700;  /* Brighter yellow on hover */
        box-shadow: 0 0 10px 2px #FFD700;  /* Glow effect */
      }
    }
    svg {
      margin-right: 8px;  /* Add some space between the icon and text if needed */
    }
  }
`;


const ReviewSection: React.FC = () => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = getAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const user = auth.currentUser;
        if (!user) throw new Error('User not logged in');

        // Firestore query to fetch all mnemonic documents
        const db = getFirestore();
        const querySnapshot = await getDocs(collection(db, 'users', user.uid, 'mnemonics'));

        const now = new Date();  // Get the current date
        const fetchedFlashcards: Flashcard[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const flashcardsArray = data.flashcards || [];  // Get the flashcards array

          // Iterate over each flashcard in the array
          flashcardsArray.forEach((flashcard: any) => {
            const nextReviewDate = new Date(flashcard.nextReviewDate);  // Convert the string to a Date

            // Check if the flashcard is past due
            if (nextReviewDate <= now) {
              fetchedFlashcards.push({
                id: doc.id,
                word: flashcard.word,
                mnemonic: flashcard.mnemonic,
                nextReviewDate: flashcard.nextReviewDate,
                reviewInterval: flashcard.reviewInterval,
                type: 'flashcards',
              });
            }
          });
        });

        setFlashcards(fetchedFlashcards);  // Set the state with the past due flashcards

      } catch (err) {
        console.error('Error fetching flashcards:', err);
        setError('Failed to fetch flashcards for review.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [auth]);

  const handleReview = async (flashcardId: string, word: string, type: string, success: boolean) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not logged in');

      const db = getFirestore();
      const docRef = doc(db, 'users', user.uid, 'mnemonics', flashcardId);
      const docSnapshot = await getDoc(docRef);
      const flashcardsArray = docSnapshot.data()?.flashcards;

      // Find the flashcard to update
      const updatedFlashcards = flashcardsArray.map((flashcard: any) => {
        if (flashcard.word === word) {
          // Adjust the reviewInterval and nextReviewDate based on the result
          const newReviewInterval = success ? flashcard.reviewInterval * 2 : Math.max(flashcard.reviewInterval / 2, 1);
          const nextReviewDate = new Date();
          nextReviewDate.setDate(nextReviewDate.getDate() + newReviewInterval);

          return {
            ...flashcard,
            reviewInterval: newReviewInterval,
            nextReviewDate: nextReviewDate.toISOString(),
          };
        }
        return flashcard;
      });

      // Update the Firestore document with the updated flashcards array
      await updateDoc(docRef, {
        flashcards: updatedFlashcards
      });

      // Remove reviewed flashcard from the UI state
      setFlashcards((prevFlashcards) => prevFlashcards.filter((card) => card.word !== word));

    } catch (err) {
      console.error('Error updating flashcard review:', err);
      setError('Failed to update flashcard.');
    }
  };

const handleFlip = (cardId: string) => {
  setFlippedIndices((prevFlipped) =>
    prevFlipped.includes(cardId)
      ? prevFlipped.filter((id) => id !== cardId)
      : [...prevFlipped, cardId]
  );
};


  if (loading) return <div className="text-center mt-5">Loading flashcards for review...</div>;
  if (error) return <div className="alert alert-danger text-center">{error}</div>;
  if (flashcards.length === 0) return <div className="alert alert-info text-center">No flashcards due for review.</div>;

  return (
    <div className="container mt-4">
      <h3 className="text-center mb-4">Flashcards for Review</h3>
      <div className="row">
        {flashcards.map((flashcard, index) => (
          <div key={flashcard.word} className="col-md-6 mb-4">
            <CardWrapper onClick={() => handleFlip(flashcard.id)}>
            <div className={`inner-card ${flippedIndices.includes(flashcard.id) ? 'flipped' : ''}`}>
                {/* Front side of the card */}
                <CardFace front>
                  <CardTitle>{flashcard.word}</CardTitle>
                </CardFace>
  
                {/* Back side of the card */}
                <CardFace>
                  <div>
                    <CardText>{flashcard.mnemonic}</CardText>
                    <ButtonWrapper>
                      <button
                        className="btn remembered"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent flipping when clicking the button
                          handleReview(flashcard.id, flashcard.word, flashcard.type, true);
                        }}
                      >
                        <FontAwesomeIcon icon={faThumbsUp} /> I Remembered
                      </button>
  
                      <button
                        className="btn forgot"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReview(flashcard.id, flashcard.word, flashcard.type, false);
                        }}
                      >
                        <FontAwesomeIcon icon={faThumbsDown} /> I Forgot
                      </button>
                    </ButtonWrapper>
                  </div>
                </CardFace>
              </div>
            </CardWrapper>
          </div>
        ))}
      </div>
    </div>
  );
}  

export default ReviewSection;
