import clsx from 'clsx';
import { FileText, LoaderCircle, Upload } from 'lucide-react';
import { useId, useState, type DragEvent, type FormEvent } from 'react';
import DemoBanner from '../components/DemoBanner';
import FlashcardGrid from '../components/FlashcardGrid';
import { Bilingual, Button, ButtonLink } from '../components/ui/Button';
import { Alert } from '../components/ui/Feedback';
import { ChoiceGroup } from '../components/ui/Form';
import { Photo } from '../components/ui/Photo';
import { useDeck } from '../flashcards/context';
import { ApiError, generateFlashcards } from '../lib/api';
import { LEVELS } from '../lib/levels';
import { countOccurrences, loadWordsForLevel, sampleWords, topWords, type JlptLevel } from '../lib/words';
import type { Flashcard } from '../types/flashcard';

const MAX_WORDS = 20;

type WordSource = 'pdf' | 'random';

const isPdf = (file: File) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

const uniqueByWord = (cards: Flashcard[]) =>
  cards.filter((card, index) => cards.findIndex((c) => c.word === card.word) === index);

function errorMessage(error: unknown): string {
  // 4xx messages and 503 ("temporarily unavailable") are written for users; others aren't.
  if (error instanceof ApiError && (error.status < 500 || error.status === 503)) return error.message;
  return 'Could not generate flashcards. Please try again.';
}

function PdfDropzone({ file, onFile }: { file: File | null; onFile: (file: File | null, error?: string) => void }) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);

  const accept = (candidate: File | undefined) => {
    if (!candidate) return;
    if (!isPdf(candidate)) onFile(null, 'Please choose a PDF file.');
    else onFile(candidate);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files[0]);
  };

  return (
    <div>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={clsx(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed px-6 py-10 text-center transition-colors',
          'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ai',
          dragging ? 'border-ai bg-sky/50' : 'border-ink/25 hover:border-ink/50 hover:bg-raised/60',
        )}
      >
        {file ? (
          <>
            <FileText aria-hidden className="size-6 text-ai" strokeWidth={1.5} />
            <span className="font-medium">{file.name}</span>
            <span className="text-xs text-ink-muted">Click or drop another file to replace it</span>
          </>
        ) : (
          <>
            <Upload aria-hidden className="size-6 text-ink-muted" strokeWidth={1.5} />
            <span>
              <span className="font-medium">Drop a Japanese PDF here</span> or click to choose one
            </span>
            <span className="text-xs text-ink-muted">Read in your browser and never uploaded</span>
          </>
        )}
        <input
          id={inputId}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => accept(e.target.files?.[0])}
        />
      </label>
    </div>
  );
}

export default function Create() {
  const { addCards, meta } = useDeck();
  const demoWords = meta?.sampleWords;

  const [source, setSource] = useState<WordSource>('pdf');
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<JlptLevel>(5);
  const [wordCount, setWordCount] = useState(5);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Flashcard[]>([]);

  const busy = progress !== null;
  const canSubmit = !busy && (source === 'random' || file !== null);

  const pickWords = async (): Promise<string[]> => {
    // In demo mode, random words come from the sample set so every card is complete.
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
      setProgress(`Writing ${words.length} flashcards…`);
      const cards = await generateFlashcards(words, level);
      setCreated(uniqueByWord(cards));
      addCards(cards);
    } catch (err) {
      console.error('Flashcard generation failed', err);
      setError(errorMessage(err));
    } finally {
      setProgress(null);
    }
  };

  return (
    <>
      <Photo
        name="kanji-shutters"
        priority
        overlay="dark"
        sizes="(min-width: 1152px) 1152px, 100vw"
        className="-mx-5 h-44 sm:mx-0 sm:h-52 sm:rounded-[32px]"
      >
        <div className="flex h-full flex-col justify-end p-6 text-[#fffefa] sm:p-8">
          <p lang="ja" className="font-display text-xs tracking-label uppercase opacity-85">
            作成
          </p>
          <h1 className="mt-1 text-4xl">Create flashcards</h1>
        </div>
      </Photo>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_1.1fr]">
        <form onSubmit={handleSubmit} className="space-y-9">
          {meta?.demoMode && <DemoBanner onCreatePage />}

          <ChoiceGroup<WordSource>
            legend="Source · 単語の出典"
            value={source}
            onChange={setSource}
            options={[
              { value: 'pdf', label: 'From a PDF' },
              { value: 'random', label: 'Random words' },
            ]}
          />

          {source === 'pdf' && (
            <PdfDropzone
              file={file}
              onFile={(next, problem) => {
                setFile(next);
                setError(problem ?? null);
              }}
            />
          )}

          <ChoiceGroup<JlptLevel>
            legend="JLPT level · レベル"
            value={level}
            onChange={setLevel}
            options={LEVELS.map((info) => ({
              value: info.level,
              label: <span className="font-mono">{info.label}</span>,
              selectedClassName: info.bg,
            }))}
          />

          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="word-count" className="label">
                Number of words · 単語数
              </label>
              <output htmlFor="word-count" className="font-mono text-lg">
                {wordCount}
              </output>
            </div>
            <input
              id="word-count"
              type="range"
              min={1}
              max={MAX_WORDS}
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
              className="mt-3 w-full accent-ai"
            />
            <p className="mt-1 text-xs text-ink-muted">Plus up to five related words suggested for you.</p>
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={!canSubmit}>
            {busy ? (
              <>
                <LoaderCircle aria-hidden className="size-4 animate-spin" strokeWidth={1.75} />
                {progress}
              </>
            ) : (
              <Bilingual en="Generate flashcards" ja="カードを作る" />
            )}
          </Button>
        </form>

        <section aria-labelledby="created-heading" aria-live="polite">
          <h2 id="created-heading" className="label">
            New cards · 新しいカード
          </h2>
          {created.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-dashed border-line px-6 py-16 text-center text-sm text-ink-muted">
              Your new cards will appear here.
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm text-ink-muted">Saved to your library. Their first review is tomorrow.</p>
              <div className="mt-4">
                <FlashcardGrid cards={created} columns={2} />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink to="/dashboard">
                  <Bilingual en="Go to dashboard" ja="ダッシュボード" />
                </ButtonLink>
                <ButtonLink to="/library" variant="secondary">
                  <Bilingual en="View library" ja="単語帳" />
                </ButtonLink>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
