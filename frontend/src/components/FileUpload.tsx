import React, { useState } from 'react';
import { extractTextFromPDF } from '../utils/pdfUtils';
import { countWordFrequency, getTopWords, allWords, getRandomWords } from '../utils/wordUtils';
import generateMnemonicsAndWords from '../utils/FlashGenerator'; // Import the mnemonic generation function
import FlashcardComponent from './FlashCard'; // Import the FlashcardComponent
import { Button, Container, Row, Col, Spinner, Form } from 'react-bootstrap'; // Using Bootstrap for layout and buttons

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [flashcards, setFlashcards] = useState<{ word: string; mnemonic: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [difficultyLevel, setDifficultyLevel] = useState<number>(5); // Default to level 5
  const [topWordsCount, setTopWordsCount] = useState<number>(5); // Default to top 5 words
  const [randomSelection, setRandomSelection] = useState<boolean>(false); // New state for random selection

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    // Prevent action if neither a file is uploaded nor random selection is checked
    if (!file && !randomSelection) return;
  
    setLoading(true); // Set loading to true
    setError(null); // Reset any previous errors
  
    try {
      let topWords: string[] = [];
  
      if (randomSelection) {
        // Randomly select words based on difficulty level
        const wordsByDifficulty = allWords.filter((word) => word.difficulty === difficultyLevel);
        topWords = getRandomWords(wordsByDifficulty, topWordsCount);
      } else if (file) {
        // Step 1: Extract text from PDF
        const text = await extractTextFromPDF(file);
        console.log('Extracted text:', text);
  
        // Step 2: Count word frequency based on selected difficulty level
        const wordCounts = countWordFrequency(text, allWords, difficultyLevel);
        console.log('Word counts:', wordCounts);
  
        // Get top words based on word frequency
        topWords = getTopWords(wordCounts, topWordsCount);
      }
  
      console.log(`Top ${topWordsCount} words:`, topWords);
  
      // Step 3: Generate mnemonics and additional words using the top words
      const { originalWords, relatedWords } = await generateMnemonicsAndWords(topWords);
  
      console.log('original array', originalWords);
      console.log('new word array:', relatedWords);
  
      // Combine the original words with the related words
      const combinedWords = [...originalWords, ...relatedWords];
  
      // Step 4: Remove duplicates (based on the word property)
      const uniqueFlashcards = combinedWords.filter(
        (flashcard, index, self) =>
          index === self.findIndex((f) => f.word === flashcard.word)
      );
  
      // Step 5: Set the flashcards state
      setFlashcards(uniqueFlashcards);
      console.log('Unique flashcards:', uniqueFlashcards);
    } catch (error) {
      console.error('Error processing:', error);
      setError('Failed to process the file or generate words.');
    } finally {
      setLoading(false); // Set loading to false
    }
  };
  
 
  return (
    <Container className="my-5">
      <h2 className="text-center mb-4">Upload a PDF</h2>
      <Row className="justify-content-center">
        <Col md={6} className="text-center">
          <input
            type="file"
            accept=".pdf"
            onChange={handleChange}
            className="form-control mb-3"
          />
          {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
        </Col>
      </Row>

      <Row className="justify-content-center mt-4">
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Select Difficulty Level (N1-N5):</Form.Label>
            <Form.Select
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(parseInt(e.target.value, 10))}
            >
              <option value={1}>N1</option>
              <option value={2}>N2</option>
              <option value={3}>N3</option>
              <option value={4}>N4</option>
              <option value={5}>N5</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Row className="justify-content-center mt-4">
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Select Number of Top Words:</Form.Label>
            <Form.Control
              type="number"
              value={topWordsCount}
              onChange={(e) => setTopWordsCount(parseInt(e.target.value, 10))}
              min="1"
            />
          </Form.Group>
        </Col>
      </Row>

      <Row className="justify-content-center mt-4">
  <Col md={6} className="text-center"> {/* Center the checkbox */}
    <Form.Group className="mb-3 d-flex align-items-center justify-content-center"> {/* Flexbox for alignment */}
      <Form.Check 
        type="checkbox" 
        label={<span style={{ fontSize: '1.2rem' }}>Randomly Generate Words</span>} // Larger font for label
        checked={randomSelection} 
        onChange={(e) => setRandomSelection(e.target.checked)} 
        className="me-2" // Small margin between the checkbox and label
      />
    </Form.Group>
  </Col>
</Row>
      <Row className="justify-content-center mt-4">
        <Col md={6} className="text-center">
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!file && !randomSelection || loading}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" />
                <span className="ms-2">Processing...</span>
              </>
            ) : (
              'Generate Flashcards'
            )}
          </Button>
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
