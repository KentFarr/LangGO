import { getAuth } from 'firebase/auth';

const generateMnemonicsAndWords = async (topWords: string[]) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    if (!user) {
      console.error('User is not authenticated');
      throw new Error('User is not authenticated');
    }

    const token = await user.getIdToken();
    console.log('User token:', token);

    console.log('Top words being sent to backend:', topWords); // Added log

    const response = await fetch(`${apiUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ topWords }),
    });

    console.log('Response status:', response.status); // Added log

    if (!response.ok) {
      console.error('Response not OK:', response); // Added log
      throw new Error(`Failed to generate mnemonics. Status code: ${response.status}`);
    }

    const data = await response.json();

    // Log the received data for debugging purposes
    console.log('Received data from backend:', data);

    // Validate and extract the data based on the actual response structure
    if (!data || !data.flashcards || !data.relatedWords) {
      console.error('Invalid response data:', data); // Added log
      throw new Error('Invalid response data');
    }

    // Mapping flashcards without overwriting 'id'
    console.log('Mapping flashcards...'); // Added log
    const originalWords = data.flashcards.map((flashcard: any, index: number) => {
      console.log(`Flashcard [${index}]:`, flashcard); // Added log
      return {
        ...flashcard,
        // Do not overwrite 'id'
      };
    });

    // Mapping relatedWords without overwriting 'id'
    console.log('Mapping relatedWords...'); // Added log
    const relatedWords = data.relatedWords.map((flashcard: any, index: number) => {
      console.log(`RelatedWord [${index}]:`, flashcard); // Added log
      return {
        ...flashcard,
        // Do not overwrite 'id'
      };
    });

    console.log('Final originalWords:', originalWords); // Should show 'id' with valid values
    console.log('Final relatedWords:', relatedWords); // Should show 'id' with valid values

    return {
      originalWords,
      relatedWords,
    };
  } catch (error) {
    console.error('Error generating mnemonics:', error);
    throw error;
  }
};

export default generateMnemonicsAndWords;
