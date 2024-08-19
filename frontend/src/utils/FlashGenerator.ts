// utils/FlashGenerator.ts

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
        throw new Error('Failed to generate mnemonics.');
      }
  
      const data = await response.json();
  
      // Assuming the backend sends 'mnemonics' and 'additionalWords' in separate fields
      return {
        mnemonics: data.mnemonics || [],  // Ensure mnemonics is an array
        additionalWords: data.additionalWords || [],  // Ensure additionalWords is an array
      };
    } catch (error) {
      console.error('Error generating mnemonics:', error);
      throw error;
    }
  };
  
  export default generateMnemonicsAndWords;
  