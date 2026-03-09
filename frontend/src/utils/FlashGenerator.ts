import { getAuth } from 'firebase/auth';
import { GeneratedFlashcard } from '../types/flashcards';

interface MnemonicsResponse {
  flashcards: GeneratedFlashcard[];
  relatedWords: GeneratedFlashcard[];
}

const isValidResponse = (data: unknown): data is MnemonicsResponse => {
  if (!data || typeof data !== 'object') return false;
  const maybe = data as Partial<MnemonicsResponse>;
  return Array.isArray(maybe.flashcards) && Array.isArray(maybe.relatedWords);
};

const generateMnemonicsAndWords = async (topWords: string[]) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    if (!user) {
      throw new Error('User is not authenticated');
    }

    const token = await user.getIdToken();

    const response = await fetch(
      `${apiUrl}/openai/generate-mnemonics`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topWords }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to generate mnemonics. Status code: ${response.status}`);
    }

    const data: unknown = await response.json();

    if (!isValidResponse(data)) {
      throw new Error('Invalid response data from mnemonics API');
    }

    const { flashcards, relatedWords } = data;

    return {
      originalWords: flashcards,
      relatedWords,
    };
  } catch (error) {
    console.error('Error generating mnemonics:', error);
    throw error;
  }
};

export default generateMnemonicsAndWords;
