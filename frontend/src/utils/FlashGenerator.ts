const generateMnemonicsAndWords = async (topWords: string[]) => {
  try {
    const response = await fetch('http://localhost:5000/generate-mnemonics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    //const mnemonics = data.flashcards.map((flashcard: { mnemonic: string }) => flashcard.mnemonic);
    //const words = data.flashcards.map((wordObj: { word: string }) => wordObj.word);

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
