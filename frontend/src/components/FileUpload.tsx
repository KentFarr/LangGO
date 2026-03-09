// FileUpload.tsx
import React from 'react';
import FlashcardComponent from './FlashCard'; // Import the FlashcardComponent
import { Button, Container, Row, Col, Spinner, Form } from 'react-bootstrap';
import { useFlashcardGeneration } from '../hooks/useFlashcardGeneration';

const FileUpload: React.FC = () => {
  const {
    flashcards,
    loading,
    error,
    difficultyLevel,
    topWordsCount,
    randomSelection,
    setDifficultyLevel,
    setTopWordsCount,
    setRandomSelection,
    handleFileChange,
    generateFromCurrentSelection,
  } = useFlashcardGeneration();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    await generateFromCurrentSelection();
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
        <Col md={6} className="text-center">
          <Form.Group className="mb-3 d-flex align-items-center justify-content-center">
            <Form.Check
              type="checkbox"
              label={<span style={{ fontSize: '1.2rem' }}>Randomly Generate Words</span>}
              checked={randomSelection}
              onChange={(e) => setRandomSelection(e.target.checked)}
              className="me-2"
            />
          </Form.Group>
        </Col>
      </Row>

      <Row className="justify-content-center mt-4">
        <Col md={6} className="text-center">
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={loading}
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
