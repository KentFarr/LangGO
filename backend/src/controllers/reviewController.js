const admin = require('../../config/firebaseConfig');

// Function to fetch flashcards that are due for review
const getFlashcardsForReview = async (req, res) => {
  const { uid } = req.params;

  try {
    const db = admin.firestore();
    const flashcardsRef = db.collection('users').doc(uid).collection('mnemonics');
    
    // Get the current time in ISO format
    const now = new Date().toISOString();

    // Fetch flashcards where nextReviewDate is due or past
    const snapshot = await flashcardsRef
      .where('nextReviewDate', '<=', now)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'No flashcards due for review.' });
    }

    const flashcards = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({ flashcards });
  } catch (error) {
    console.error('Error fetching flashcards for review:', error);
    return res.status(500).json({ error: 'Failed to fetch flashcards for review.' });
  }
};


// Function to update flashcard review status
const updateFlashcardReview = async (req, res) => {
    const { uid, flashcardId } = req.params;
    const { word, type, success } = req.body; // Extract word, type, and success from the request body
  
    console.log(`Updating review for word: ${word}, type: ${type}, success: ${success}`);
  
    try {
      const db = admin.firestore();
      const flashcardRef = db.collection('users').doc(uid).collection('mnemonics').doc(flashcardId);
      const flashcardDoc = await flashcardRef.get();
  
      if (!flashcardDoc.exists) {
        return res.status(404).json({ error: 'Flashcard not found' });
      }
  
      const flashcardData = flashcardDoc.data();
      let targetArray = flashcardData[type]; // Either flashcards or relatedWords
  
      // Find the word within the target array
      const wordIndex = targetArray.findIndex(item => item.word === word);
      if (wordIndex === -1) {
        return res.status(404).json({ error: 'Word not found in the specified array.' });
      }
  
      // Update the reviewInterval and nextReviewDate for the word
      const currentInterval = targetArray[wordIndex].reviewInterval;
      const newInterval = success ? currentInterval * 2 : Math.max(1, currentInterval / 2);
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  
      // Update the word with the new reviewInterval and nextReviewDate
      targetArray[wordIndex].reviewInterval = newInterval;
      targetArray[wordIndex].nextReviewDate = nextReviewDate.toISOString();
  
      // Update the document in Firestore
      await flashcardRef.update({
        [type]: targetArray // Update the specific array (flashcards or relatedWords)
      });
  
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating flashcard review:', error);
      return res.status(500).send('Failed to update flashcard review.');
    }
  };
  
module.exports = { getFlashcardsForReview, updateFlashcardReview };
