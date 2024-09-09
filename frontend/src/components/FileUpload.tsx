import React, { useState } from 'react';
import { extractTextFromPDF } from '../utils/pdfUtils';
import { countWordFrequency, getTopWords, allWords } from '../utils/wordUtils';
import generateMnemonicsAndWords from '../utils/FlashGenerator'; // Import the mnemonic generation function
import FlashcardComponent from './FlashCard'; // Import the FlashcardComponent
import { Button, Container, Row, Col, Spinner } from 'react-bootstrap'; // Using Bootstrap for layout and buttons

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [flashcards, setFlashcards] = useState<{ word: string; mnemonic: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [difficultyLevel, setDifficultyLevel] = useState<number>(5); // Default to level 1

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

      // Step 2: Count word frequency based on selected difficulty level
      const wordCounts = countWordFrequency(text, allWords, difficultyLevel);
      console.log('Word counts:', wordCounts);
      const top5Words = getTopWords(wordCounts);
      console.log('Top 5 words:', top5Words);

      // Step 3: Generate mnemonics and additional words using the top 5 words
      const { originalWords, relatedWords } = await generateMnemonicsAndWords(top5Words);

      console.log('original array', originalWords);
      console.log('new word array:', relatedWords);

      // Combine the original words with the related words      
      const finalCards = originalWords.concat(relatedWords);

      // Step 4: Set the flashcards state
      setFlashcards(finalCards);
      console.log('Flashcards:', finalCards);
    } catch (error) {
      console.error('Error processing file:', error);
      setError('Failed to process the PDF.');
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  return (
    <Container className="my-5">
      <h2 className="text-center mb-4">Upload a PDF</h2>
      <Row className="justify-content-center">
        <Col md={6} className="text-center">
          <input type="file" accept=".pdf" onChange={handleChange} className="form-control mb-3" />
          <Button onClick={handleUpload} disabled={loading} variant="primary">
            {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Upload and Process'}
          </Button>

          {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
        </Col>
      </Row>

      <Row className="justify-content-center mt-4">
        <Col md={6} className="text-center">
          <label htmlFor="difficulty">Select Difficulty Level (1-5):</label>
          <select
            id="difficulty"
            value={difficultyLevel}
            onChange={(e) => setDifficultyLevel(parseInt(e.target.value, 10))}
            className="form-select mb-3"
          >
            <option value={1}>N1</option>
            <option value={2}>N2</option>
            <option value={3}>N3</option>
            <option value={4}>N4</option>
            <option value={5}>N5</option>
          </select>
        </Col>
      </Row>

      {/* Flashcards Display */}
      {flashcards.length > 0 && (
        <div className="mt-5">
          <h3 className="text-center mb-4">Generated Flashcards</h3>
          <FlashcardComponent flashcards={flashcards} />
        </div>
      )}
    </Container>
  );
};

export default FileUpload;
