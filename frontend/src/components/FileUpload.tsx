import React, { useState } from 'react';
import { extractTextFromPDF } from '../utils/pdfUtils';
import { countWordFrequency, getTopWords, allWords } from '../utils/wordUtils';

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [topWords, setTopWords] = useState<string[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true); // Set loading to true

    try {
      const text = await extractTextFromPDF(file);
      console.log('Extracted text:', text);
      const wordCounts = countWordFrequency(text, allWords);
      console.log('Word counts:', wordCounts);
      const top5Words = getTopWords(wordCounts);
      setTopWords(top5Words);
      console.log('Top 5 words:', top5Words);
    } catch (error) {
      console.error('Error processing file:', error);
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
    </div>
  );
};

export default FileUpload;
