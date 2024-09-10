import { getAuth } from 'firebase/auth';

// Fetch flashcards that are due for review
export const getFlashcardsForReview = async (uid: string) => {
  try {
    const token = await getAuth().currentUser?.getIdToken();

    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`/api/review/${uid}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();  // Log response text for debugging
      console.error('Error fetching flashcards:', errorText);
      throw new Error(`Failed to fetch flashcards: ${response.statusText}`);
    }

    // Return the JSON response
    return await response.json();
  } catch (error) {
    console.error('Error in getFlashcardsForReview:', error);
    throw error;  // Re-throw the error to be caught by calling functions
  }
};

// Update flashcard review status
export const updateFlashcardReview = async (uid: string, flashcardId: string, word: string, type: string, success: boolean) => {
  try {
    const token = await getAuth().currentUser?.getIdToken();

    if (!token) {
      throw new Error('User not authenticated');
    }

    // Send the additional data that the backend might require
    const response = await fetch(`/api/review/${uid}/${flashcardId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        word,     // Send the word being reviewed
        type,     // Type of flashcard (flashcards or relatedWords)
        success   // Success/failure of the review
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error updating flashcard review:', errorText);
      throw new Error(`Failed to update flashcard review: ${response.statusText}`);
    }

    // Return the JSON response if needed
    return await response.json();
  } catch (error) {
    console.error('Error in updateFlashcardReview:', error);
    throw error;  // Re-throw the error to be caught by calling functions
  }
};
