import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Alert, Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import { ApiError, generateFlashcards } from '../lib/api';
import {
  countOccurrences,
  JLPT_LEVELS,
  loadWordsForLevel,
  sampleWords,
  topWords,
  type JlptLevel,
} from '../lib/words';
import type { Flashcard } from '../types/flashcard';
import FlashcardGrid from './FlashcardGrid';

const MAX_WORDS = 20;

type WordSource = 'pdf' | 'random';

const isPdf = (file: File) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

const uniqueByWord = (cards: Flashcard[]) =>
  cards.filter((card, index) => cards.findIndex((c) => c.word === card.word) === index);

function errorMessage(error: unknown): string {
  // 4xx messages and 503 ("temporarily unavailable") are written for users; others aren't.
  if (error instanceof ApiError && (error.status < 500 || error.status === 503)) {
    return error.message;
  }
  return 'Could not generate flashcards. Please try again.';
}

interface FlashcardGeneratorProps {
  onGenerated: (cards: Flashcard[]) => void;
  /** In demo mode, random words come from these so every card is a complete sample. */
  demoWords?: Record<JlptLevel, string[]> | null;
}

export default function FlashcardGenerator({ onGenerated, demoWords }: FlashcardGeneratorProps) {
  const [source, setSource] = useState<WordSource>('pdf');
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<JlptLevel>(5);
  const [wordCount, setWordCount] = useState(5);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Flashcard[]>([]);

  const busy = progress !== null;
  const canSubmit = !busy && (source === 'random' || file !== null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    if (selected && !isPdf(selected)) {
      setError('Please choose a PDF file.');
      setFile(null);
      return;
    }
    setError(null);
    setFile(selected);
  };

  const pickWords = async (): Promise<string[]> => {
    if (source === 'random' && demoWords) return sampleWords(demoWords[level], wordCount);
    const vocabulary = await loadWordsForLevel(level);
    if (source === 'random' || !file) return sampleWords(vocabulary, wordCount);

    setProgress('Reading PDF…');
    const { extractTextFromPdf } = await import('../lib/pdf');
    const text = await extractTextFromPdf(file);
    return topWords(countOccurrences(text, vocabulary), wordCount);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setProgress('Loading vocabulary…');
    try {
      const words = await pickWords();
      if (words.length === 0) {
        setError(`No N${level} words were found in this PDF. Try a different level or file.`);
        return;
      }

      setProgress(`Generating flashcards for ${words.length} words…`);
      const created = await generateFlashcards(words);
      setGenerated(uniqueByWord(created));
      onGenerated(created);
    } catch (err) {
      console.error('Flashcard generation failed', err);
      setError(errorMessage(err));
    } finally {
      setProgress(null);
    }
  };

  return (
    <section aria-labelledby="generate-heading">
      <h2 id="generate-heading" className="h3 text-center mb-4">
        Create flashcards
      </h2>

      <Form onSubmit={handleSubmit} className="mx-auto" style={{ maxWidth: 560 }}>
        <Form.Group as="fieldset" className="mb-3">
          <Form.Label as="legend" className="fs-6">
            Where should the words come from?
          </Form.Label>
          <div>
            <Form.Check
              inline
              type="radio"
              id="source-pdf"
              name="source"
              label="A Japanese PDF"
              checked={source === 'pdf'}
              onChange={() => setSource('pdf')}
            />
            <Form.Check
              inline
              type="radio"
              id="source-random"
              name="source"
              label="Random words"
              checked={source === 'random'}
              onChange={() => setSource('random')}
            />
          </div>
        </Form.Group>

        {source === 'pdf' && (
          <Form.Group className="mb-3" controlId="pdf-file">
            <Form.Label>PDF file</Form.Label>
            <Form.Control type="file" accept="application/pdf,.pdf" onChange={handleFileChange} />
            <Form.Text>The PDF is read in your browser and is never uploaded.</Form.Text>
          </Form.Group>
        )}

        <Row>
          <Col sm={6}>
            <Form.Group className="mb-3" controlId="jlpt-level">
              <Form.Label>JLPT level</Form.Label>
              <Form.Select
                value={level}
                onChange={(e) => setLevel(Number(e.target.value) as JlptLevel)}
              >
                {JLPT_LEVELS.map((value) => (
                  <option key={value} value={value}>
                    N{value}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col sm={6}>
            <Form.Group className="mb-3" controlId="word-count">
              <Form.Label>Number of words</Form.Label>
              <Form.Control
                type="number"
                min={1}
                max={MAX_WORDS}
                value={wordCount}
                onChange={(e) =>
                  setWordCount(Math.min(MAX_WORDS, Math.max(1, Number(e.target.value) || 1)))
                }
              />
            </Form.Group>
          </Col>
        </Row>

        <div className="text-center">
          <Button type="submit" variant="primary" disabled={!canSubmit}>
            {busy ? (
              <>
                <Spinner animation="border" size="sm" aria-hidden className="me-2" />
                {progress}
              </>
            ) : (
              'Generate flashcards'
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="danger" className="mt-3 mb-0">
            {error}
          </Alert>
        )}
      </Form>

      {generated.length > 0 && (
        <div className="mt-5">
          <h3 className="h4 text-center mb-4">Your new flashcards</h3>
          <FlashcardGrid cards={generated} />
        </div>
      )}
    </section>
  );
}
