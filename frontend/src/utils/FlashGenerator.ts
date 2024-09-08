import { getAuth } from 'firebase/auth';

const generateMnemonicsAndWords = async (topWords: string[]) => {
  try {

    
    const auth = getAuth();
    const user = auth.currentUser 
    if (!user) {
      console.error('User is not authenticated');
      throw new Error('User is not authenticated');
    } 

    const token = await user.getIdToken();
    console.log('User token:', token);  


    const response = await fetch('http://localhost:5000/openai/generate-mnemonics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ topWords }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate mnemonics. Status code: ${response.status}`);
    }

    const data = await response.json();

    // Log the received data for debugging purposes
    console.log('Received data from backend:', data);

    // Validate and extract the data based on the actual response structure
    if (!data || !data.flashcards || !data.relatedWords) {
      throw new Error('Invalid response data');}

    // Extract mnemonics from flashcards and additional_words arrays
    const originalWords = data.flashcards;
    const relatedWords = data.relatedWords;
    
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
