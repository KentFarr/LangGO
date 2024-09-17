import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getFirestore, collection, query, getDocs, orderBy, limit, doc, getDoc, updateDoc } from 'firebase/firestore';
import FlashcardComponent from '../components/FlashCard'; // Import the flashcard component

interface Flashcard {
  id: string;
  docId: string;
  word: string;
  mnemonic: string;
  type: string;
}

const FlashcardList: React.FC = () => {
  const { user } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.uid) {
      fetchFlashcards(user.uid);
    }
  }, [user]);

  const fetchFlashcards = async (uid: string) => {
    setLoading(true);
    setError(null);

    try {
      const db = getFirestore();
      console.log('Fetching the last 100 flashcards from Firestore...');
      
      const q = query(
        collection(db, 'users', uid, 'mnemonics'), 
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const querySnapshot = await getDocs(q);

      const fetchedFlashcards: Flashcard[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Document data:', data);

        const { flashcards: topWordsArray, relatedWords: relatedWordsArray } = data;

        if (topWordsArray) {
          for (let i = 0; i < topWordsArray.length; i++) {
            fetchedFlashcards.push({
              id: topWordsArray[i].id,
              docId: doc.id,
              word: topWordsArray[i].word,
              mnemonic: topWordsArray[i].mnemonic,
              type: 'flashcards',
            });
          }
        }

        if (relatedWordsArray) {
          for (let i = 0; i < relatedWordsArray.length; i++) {
            fetchedFlashcards.push({
              id: relatedWordsArray[i].id,
              docId: doc.id,
              word: relatedWordsArray[i].word,
              mnemonic: relatedWordsArray[i].mnemonic,
              type: 'relatedWords',
            });
          }
        }
      });

      console.log('Fetched flashcards:', fetchedFlashcards);

      setFlashcards(fetchedFlashcards);
    } catch (err) {
      console.error('Error fetching flashcards:', err);
      setError('Failed to fetch flashcards');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string, docId: string, type: string) => {
    try {
      const db = getFirestore();
      if (!user) {
        setError('User is not authenticated');
        return;
      }
      const docRef = doc(db, 'users', user.uid, 'mnemonics', docId);
      const docSnapshot = await getDoc(docRef);
      const data = docSnapshot.data();

      if (!data) {
        console.error('No document found!');
        return;
      }

      let flashcardsArray = data.flashcards || [];
      let relatedWordsArray = data.relatedWords || [];

      // Remove the flashcard from the appropriate array
      if (type === 'flashcards') {
        flashcardsArray = flashcardsArray.filter((flashcard: any) => flashcard.id !== id);
      } else if (type === 'relatedWords') {
        relatedWordsArray = relatedWordsArray.filter((flashcard: any) => flashcard.id !== id);
      }

      // Update the Firestore document
      await updateDoc(docRef, {
        flashcards: flashcardsArray,
        relatedWords: relatedWordsArray,
      });

      // Update the local state to remove the flashcard
      setFlashcards((prevFlashcards) => prevFlashcards.filter((flashcard) => flashcard.id !== id));
    } catch (err) {
      console.error('Error removing flashcard:', err);
      setError('Failed to remove flashcard');
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
      <h3 className="text-center">All Flashcards</h3>
      {flashcards.length > 0 ? (
        <FlashcardComponent flashcards={flashcards} handleRemove={handleRemove} />
      ) : (
        <div>No flashcards found.</div>
      )}
    </div>
  );
};

export default FlashcardList;
