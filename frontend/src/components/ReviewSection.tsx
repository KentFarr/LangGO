import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faThumbsDown } from '@fortawesome/free-solid-svg-icons';
import { FlashcardType, StoredFlashcard } from '../types/flashcards';
import { getNextReviewSchedule } from '../utils/spacedRepetition';

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

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 20px;

  button {
    width: 45%; /* Adjust the width for better text fit */
    padding: 10px 20px; /* Add padding for more space */
    font-size: 16px; /* Font size for better readability */
    text-align: center; /* Center the text */
    border-radius: 8px; /* Rounded corners for a modern look */
    border: none; /* Remove default border */
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s ease; /* Smooth transition for hover effects */
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Light shadow for depth */

    &.remembered {
      background-color: #495e57; /* Dark green for "I Remembered" */
      color: #f5f7f8; /* Light text for contrast */

      &:hover {
        background-color: #6b8f71; /* Brighter green on hover */
        box-shadow: 0 0 10px 2px #6b8f71; /* Glow effect */
      }
    }

    &.forgot {
      background-color: #f4ce14; /* Bright yellow for "I Forgot" */
      color: #45474b; /* Dark text for contrast */

      &:hover {
        background-color: #ffd700; /* Brighter yellow on hover */
        box-shadow: 0 0 10px 2px #ffd700; /* Glow effect */
      }
    }

    svg {
      margin-right: 8px; /* Add some space between the icon and text if needed */
    }
  }
`;

const ReviewSection: React.FC = () => {
  const [flashcards, setFlashcards] = useState<StoredFlashcard[]>([]);
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

        const db = getFirestore();
        const querySnapshot = await getDocs(
          collection(db, 'users', user.uid, 'mnemonics')
        );

        const now = new Date();
        const fetchedFlashcards: StoredFlashcard[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data() as
            | { flashcards?: StoredFlashcard[]; relatedWords?: StoredFlashcard[] }
            | undefined;

          const flashcardsArray = data?.flashcards ?? [];

          flashcardsArray.forEach((flashcard) => {
            const nextReviewDate = new Date(flashcard.nextReviewDate);

            if (nextReviewDate <= now) {
              fetchedFlashcards.push({
                ...flashcard,
                docId: doc.id, // Include the document ID
                type: 'flashcards',
              });
            }
          });

          // If you also have relatedWords, include them here
          const relatedWordsArray = data?.relatedWords ?? [];

          relatedWordsArray.forEach((flashcard) => {
            const nextReviewDate = new Date(flashcard.nextReviewDate);

            if (nextReviewDate <= now) {
              fetchedFlashcards.push({
                ...flashcard,
                docId: doc.id, // Include the document ID
                type: 'relatedWords',
              });
            }
          });
        });

        setFlashcards(fetchedFlashcards);
      } catch (err) {
        console.error('Error fetching flashcards:', err);
        setError('Failed to fetch flashcards for review.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [auth]);

  const handleReview = async (
    flashcardId: string,
    docId: string,
    type: FlashcardType,
    success: boolean
  ) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not logged in');

      const db = getFirestore();
      const docRef = doc(db, 'users', user.uid, 'mnemonics', docId);
      const docSnapshot = await getDoc(docRef);
      const data = docSnapshot.data() as
        | { flashcards?: StoredFlashcard[]; relatedWords?: StoredFlashcard[] }
        | undefined;

      if (!data) throw new Error('Document does not exist');

      let flashcardsArray = data.flashcards ?? [];
      let relatedWordsArray = data.relatedWords ?? [];

      if (type === 'flashcards') {
        flashcardsArray = flashcardsArray.map((flashcard) => {
          if (flashcard.id === flashcardId) {
            const update = getNextReviewSchedule(
              { reviewInterval: flashcard.reviewInterval },
              success
            );
            return {
              ...flashcard,
              ...update,
            };
          }
          return flashcard;
        });
      } else if (type === 'relatedWords') {
        relatedWordsArray = relatedWordsArray.map((flashcard) => {
          if (flashcard.id === flashcardId) {
            const update = getNextReviewSchedule(
              { reviewInterval: flashcard.reviewInterval },
              success
            );
            return {
              ...flashcard,
              ...update,
            };
          }
          return flashcard;
        });
      }

      // Update the Firestore document with the updated arrays
      await updateDoc(docRef, {
        flashcards: flashcardsArray,
        relatedWords: relatedWordsArray,
      });

      // Remove reviewed flashcard from the UI state
      setFlashcards((prevFlashcards) =>
        prevFlashcards.filter((card) => card.id !== flashcardId)
      );
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

  if (loading)
    return (
      <div className="text-center mt-5">Loading flashcards for review...</div>
    );
  if (error) return <div className="alert alert-danger text-center">{error}</div>;
  if (flashcards.length === 0)
    return (
      <div className="alert alert-info text-center">
        No flashcards due for review.
      </div>
    );

  return (
    <div className="container mt-4">
      <h3 className="text-center mb-4">Flashcards for Review</h3>
      <div className="row">
        {flashcards.map((flashcard) => (
          <div key={flashcard.id} className="col-md-6 mb-4">
            <CardWrapper onClick={() => handleFlip(flashcard.id)}>
              <div
                className={`inner-card ${
                  flippedIndices.includes(flashcard.id) ? 'flipped' : ''
                }`}
              >
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
                          handleReview(
                            flashcard.id,
                            flashcard.docId,
                            flashcard.type,
                            true
                          );
                        }}
                      >
                        <FontAwesomeIcon icon={faThumbsUp} /> I Remembered
                      </button>

                      <button
                        className="btn forgot"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReview(
                            flashcard.id,
                            flashcard.docId,
                            flashcard.type,
                            false
                          );
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
};

export default ReviewSection;
