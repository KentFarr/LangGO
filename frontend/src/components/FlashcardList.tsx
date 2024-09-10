import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getFirestore, collection, query, getDocs } from 'firebase/firestore';
import FlashcardComponent from '../components/FlashCard'; // Import the flashcard component

interface Flashcard {
  word: string;
  mnemonic: string;
}

const FlashcardList: React.FC = () => {
  const { user } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.uid) {
      fetchFlashcards(user.uid); // Pass user.uid explicitly
    }
  }, [user]);

  const fetchFlashcards = async (uid: string) => {
    setLoading(true);
    setError(null);

    try {
      const db = getFirestore();
      console.log('Fetching flashcards from Firestore...');
      const q = query(collection(db, 'users', uid, 'mnemonics')); // Ensure uid is passed as string
      const querySnapshot = await getDocs(q);

      const fetchedFlashcards: Flashcard[] = [];
      const fetchedRelatedWords: Flashcard[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Document data:', data);

        const { flashcards: topWordsArray, relatedWords: relatedWordsArray } = data;

        // Extract the flashcards (top words)
        if (topWordsArray) {
          for (let i = 0; i < topWordsArray.length; i++) {
            fetchedFlashcards.push({
              word: topWordsArray[i].word,
              mnemonic: topWordsArray[i].mnemonic,
            });
          }
        }

        // Extract the related words
        if (relatedWordsArray) {
          for (let i = 0; i < relatedWordsArray.length; i++) {
            fetchedRelatedWords.push({
              word: relatedWordsArray[i].word,
              mnemonic: relatedWordsArray[i].mnemonic,
            });
          }
        }
      });

      console.log('Fetched flashcards:', fetchedFlashcards);
      console.log('Fetched related words:', fetchedRelatedWords);

      // Combine flashcards and related words into one array
      const combinedFlashcards = [...fetchedFlashcards, ...fetchedRelatedWords];
      console.log('Combined flashcards:', combinedFlashcards);

      setFlashcards(combinedFlashcards);
    } catch (err) {
      console.error('Error fetching flashcards:', err);
      setError('Failed to fetch flashcards');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h3 className='text-center'>All Flashcards</h3>
      {flashcards.length > 0 ? (
        <FlashcardComponent flashcards={flashcards} /> // Pass the combined flashcards to the component
      ) : (
        <div>No flashcards found.</div>
      )}
    </div>
  );
};

export default FlashcardList;
