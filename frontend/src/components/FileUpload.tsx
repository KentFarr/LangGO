import React, { useState } from 'react';
import { extractTextFromPDF } from '../utils/pdfUtils';
import { countWordFrequency, getTopWords, allWords } from '../utils/wordUtils';
import  generateMnemonicsAndWords  from '../utils/FlashGenerator'; // Import the mnemonic generation function
import FlashcardComponent from './FlashCard'; // Import the FlashcardComponent

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [topWords, setTopWords] = useState<string[] | null>(null);
  const [mnemonics, setMnemonics] = useState<string[] | null>(null);
  const [additionalWords, setAdditionalWords] = useState<string[] | null>(null);
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
      setTopWords(top5Words);
      console.log('Top 5 words:', top5Words);

      // Step 3: Generate mnemonics and additional words using the top 5 words
      const { mnemonics, additionalWords } = await generateMnemonicsAndWords(top5Words);
      setMnemonics(mnemonics);
      setAdditionalWords(additionalWords);
    } catch (error) {
      console.error('Error processing file:', error);
      setError('Failed to process the PDF.');
    } finally {
      setLoading(false); // Set loading to false
    }
  };
  console.log("Top Words:", topWords);
  console.log("Mnemonics:", mnemonics);
  console.log("Additional Words:", additionalWords);


  return (
    <div>
      <h2>Upload a PDF</h2>
      <input type="file" accept=".pdf" onChange={handleChange} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? 'Processing...' : 'Upload and Process'}
      </button>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      {topWords && (
        <div>
          <h3>Top 5 Words:</h3>
          <ul>
            {topWords.map((word, index) => (
              <li key={index}>{word}</li>
            ))}
          </ul>
        </div>
      )}

      {mnemonics && additionalWords && (
        <FlashcardComponent
          topWords={topWords || []}
          mnemonics={mnemonics}
          additionalWords={additionalWords}
        />
      )}
    </div>
  );
};

export default FileUpload;
