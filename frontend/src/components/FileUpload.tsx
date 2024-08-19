import React, { useState } from 'react';
import { extractTextFromPDF } from '../utils/pdfUtils';
import { countWordFrequency, getTopWords, allWords } from '../utils/wordUtils';
import generateMnemonicsAndWords from '../utils/FlashGenerator'; // Import the mnemonic generation function
import FlashcardComponent from './FlashCard'; // Import the FlashcardComponent

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [flashcards, setFlashcards] = useState<{ word: string; mnemonic: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true); // Set loading to true
    setError(null);   // Reset any previous errors

    try {
      // Step 1: Extract text from PDF
      const text = await extractTextFromPDF(file);
      console.log('Extracted text:', text);

      // Step 2: Count word frequency and get top 5 words
      const wordCounts = countWordFrequency(text, allWords);
      console.log('Word counts:', wordCounts);
      const top5Words = getTopWords(wordCounts);
      console.log('Top 5 words:', top5Words);

      // Step 3: Generate mnemonics and additional words using the top 5 words
      const { mnemonics, additionalWords } = await generateMnemonicsAndWords(top5Words);

      console.log('Mnemonics:', mnemonics);
      console.log('Additional Words:', additionalWords);

      // Combine top5Words and mnemonics into flashcards
      const flashcardsArray = top5Words.map((word, index) => ({
        word,
        mnemonic: mnemonics[index] || 'No mnemonic available',
      }));

      // Add additional words with their mnemonics
      additionalWords.forEach((word: string, index: number) => {
        flashcardsArray.push({
          word: word,
          mnemonic: mnemonics[top5Words.length + index] || 'No mnemonic available',
        });
      });

      setFlashcards(flashcardsArray);
    } catch (error) {
      console.error('Error processing file:', error);
      setError('Failed to process the PDF.');
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  return (
    <div>
      <h2>Upload a PDF</h2>
      <input type="file" accept=".pdf" onChange={handleChange} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? 'Processing...' : 'Upload and Process'}
      </button>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      {flashcards.length > 0 && (
        <FlashcardComponent flashcards={flashcards} />
      )}
    </div>
  );
};

export default FileUpload;

