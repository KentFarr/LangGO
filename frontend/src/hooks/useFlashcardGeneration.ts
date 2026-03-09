import { useState } from 'react';
import { extractTextFromPDF } from '../utils/pdfUtils';
import {
  countWordFrequency,
  getTopWords,
  allWords,
  getRandomWords,
} from '../utils/wordUtils';
import generateMnemonicsAndWords from '../utils/FlashGenerator';
import { UiFlashcard } from '../types/flashcards';

interface UseFlashcardGenerationState {
  flashcards: UiFlashcard[];
  loading: boolean;
  error: string | null;
  difficultyLevel: number;
  topWordsCount: number;
  randomSelection: boolean;
}

interface UseFlashcardGenerationApi extends UseFlashcardGenerationState {
  setDifficultyLevel: (level: number) => void;
  setTopWordsCount: (count: number) => void;
  setRandomSelection: (value: boolean) => void;
  handleFileChange: (file: File | null) => void;
  generateFromCurrentSelection: () => Promise<void>;
}

export const useFlashcardGeneration = (): UseFlashcardGenerationApi => {
  const [file, setFile] = useState<File | null>(null);
  const [flashcards, setFlashcards] = useState<UiFlashcard[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [difficultyLevel, setDifficultyLevel] = useState<number>(5);
  const [topWordsCount, setTopWordsCount] = useState<number>(5);
  const [randomSelection, setRandomSelection] = useState<boolean>(false);

  const handleFileChange = (nextFile: File | null) => {
    setFile(nextFile);
  };

  const generateFromCurrentSelection = async () => {
    if (!file && !randomSelection) return;

    setLoading(true);
    setError(null);

    if (file && !randomSelection && file.type !== 'application/pdf') {
      setError('Invalid file type. Please upload a PDF file.');
      setLoading(false);
      return;
    }

    try {
      let topWords: string[] = [];

      if (randomSelection) {
        const wordsByDifficulty = allWords.filter(
          (word) => word.difficulty === difficultyLevel
        );
        topWords = getRandomWords(wordsByDifficulty, topWordsCount);
      } else if (file) {
        const text = await extractTextFromPDF(file);
        const wordCounts = countWordFrequency(text, allWords, difficultyLevel);
        topWords = getTopWords(wordCounts, topWordsCount);
      }

      const { originalWords, relatedWords } =
        await generateMnemonicsAndWords(topWords);

      const combinedWords: UiFlashcard[] = [...originalWords, ...relatedWords];

      const uniqueFlashcards = combinedWords.filter(
        (flashcard, index, self) =>
          index === self.findIndex((f) => f.word === flashcard.word)
      );

      setFlashcards(uniqueFlashcards);
    } catch (err) {
      console.error('Error processing:', err);
      setError('Failed to process the file or generate words.');
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
};

