import clsx from 'clsx';
import { FileText, LoaderCircle, Upload, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type DragEvent, type FormEvent } from 'react';
import DemoBanner from '../components/DemoBanner';
import FlashcardGrid from '../components/FlashcardGrid';
import { Bilingual, Button, ButtonLink } from '../components/ui/Button';
import { Alert } from '../components/ui/Feedback';
import { ChoiceGroup } from '../components/ui/Form';
import { LevelBadge } from '../components/ui/LevelBadge';
import { Photo } from '../components/ui/Photo';
import { useDeck } from '../flashcards/context';
import { ApiError, extractUrl, generateFlashcards } from '../lib/api';
import { ACCEPTED_FILE_TYPES, extractTextFromFile, FILE_TYPE_LABEL, fileKind } from '../lib/extractors';
import { LEVELS } from '../lib/levels';
import { batchByLevel, MAX_LIST_WORDS, parseWordList } from '../lib/wordList';
import {
  countOccurrences,
  loadLevelIndex,
  loadWordsForLevel,
  sampleWords,
  topWords,
  type JlptLevel,
} from '../lib/words';
import type { Flashcard } from '../types/flashcard';

const MAX_WORDS = 20;

type WordSource = 'file' | 'url' | 'list' | 'random';

/** A word found by the chosen source, waiting for the user to confirm. */
interface Candidate {
  word: string;
  level: JlptLevel | null;
  /** How many times it appeared in the file or page. */
  count?: number;
}

interface Found {
  candidates: Candidate[];
  note: string;
}

const uniqueByWord = (cards: Flashcard[]) =>
  cards.filter((card, index) => cards.findIndex((c) => c.word === card.word) === index);

function errorMessage(error: unknown): string {
  // The API only sends user-facing messages, except for its generic 500.
  if (error instanceof ApiError && error.status !== 500) return error.message;
  // File readers throw friendly messages for damaged or unsupported files.
  if (error instanceof Error && /couldn't|Unsupported/.test(error.message)) return error.message;
  return 'Something went wrong. Please try again.';
}

function FileDropzone({ file, onFile }: { file: File | null; onFile: (file: File | null, error?: string) => void }) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);

  const accept = (candidate: File | undefined) => {
    if (!candidate) return;
    if (!fileKind(candidate)) onFile(null, `That file type isn't supported. Try ${FILE_TYPE_LABEL}.`);
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
            <span className="font-medium break-all">{file.name}</span>
            <span className="text-xs text-ink-muted">Click or drop another file to replace it</span>
          </>
        ) : (
          <>
            <Upload aria-hidden className="size-6 text-ink-muted" strokeWidth={1.5} />
            <span>
              <span className="font-medium">Drop a Japanese file here</span> or click to choose one
            </span>
            <span className="max-w-sm text-xs text-ink-muted">
              {FILE_TYPE_LABEL}. Read in your browser and never uploaded.
            </span>
          </>
        )}
        <input
          id={inputId}
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          className="sr-only"
          onChange={(e) => accept(e.target.files?.[0])}
        />
      </label>
      <p className="mt-2 text-xs text-ink-muted">
        Watching a YouTube video? Download its subtitles as .srt or .vtt and drop them here.
      </p>
    </div>
  );
}

function CandidateChips({ candidates, onRemove }: { candidates: Candidate[]; onRemove: (word: string) => void }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Words to turn into flashcards">
      {candidates.map(({ word, level, count }) => (
        <li key={word} className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pr-1.5 pl-3">
          <span lang="ja" className="font-jp">
            {word}
          </span>
          <LevelBadge level={level} className="h-5 px-2 text-[10px]" />
          {count !== undefined && <span className="font-mono text-[11px] text-ink-muted">×{count}</span>}
          <button
            type="button"
            onClick={() => onRemove(word)}
            aria-label={`Remove ${word}`}
            className="rounded-full p-1 text-ink-muted hover:bg-ink/5 hover:text-ink"
          >
            <X aria-hidden className="size-3.5" strokeWidth={1.75} />
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function Create() {
  const { addCards, meta } = useDeck();
  const demoWords = meta?.sampleWords;

  const [source, setSource] = useState<WordSource>('file');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [listText, setListText] = useState('');
  const [level, setLevel] = useState<JlptLevel>(5);
  const [wordCount, setWordCount] = useState(10);

  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<Found | null>(null);
  const [created, setCreated] = useState<Flashcard[]>([]);

  const busy = progress !== null;
  const resultsRef = useRef<HTMLElement>(null);

  // On narrow screens the results sit below the form, so bring them into view.
  useEffect(() => {
    if (found) resultsRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
  }, [found]);

  const parsedList = source === 'list' ? parseWordList(listText) : null;
  const ready =
    (source === 'file' && file !== null) ||
    (source === 'url' && url.trim().length > 0) ||
    (source === 'list' && (parsedList?.words.length ?? 0) > 0) ||
    source === 'random';

  /** Matches text against the selected level's word list. */
  const matchText = async (text: string, where: string): Promise<Found> => {
    setProgress('Finding words…');
    const counts = countOccurrences(text, await loadWordsForLevel(level));
    const words = topWords(counts, wordCount);
    return {
      candidates: words.map((word) => ({ word, level, count: counts.get(word) })),
      note: words.length
        ? `The ${words.length} most frequent N${level} words in ${where}.`
        : `No N${level} words were found in ${where}. Try a different level.`,
    };
  };

  const findWords = async (): Promise<Found> => {
    switch (source) {
      case 'file': {
        setProgress(`Reading ${file!.name}…`);
        return matchText(await extractTextFromFile(file!), file!.name);
      }
      case 'url': {
        setProgress('Fetching the page…');
        const page = await extractUrl(url);
        return matchText(page.text, `“${page.title}”`);
      }
      case 'list': {
        setProgress('Checking JLPT levels…');
        const index = await loadLevelIndex();
        const { words, ignored, truncated } = parsedList!;
        const notes = [`${words.length} words from your list. Levels are detected from the JLPT lists.`];
        if (ignored.length) notes.push(`Skipped ${ignored.length} without Japanese: ${ignored.slice(0, 5).join(', ')}.`);
        if (truncated) notes.push(`Only the first ${MAX_LIST_WORDS} words are used.`);
        return {
          candidates: words.map((word) => ({ word, level: index.get(word) ?? null })),
          note: notes.join(' '),
        };
      }
      case 'random': {
        const pool = demoWords ? demoWords[level] : await loadWordsForLevel(level);
        const words = sampleWords(pool, wordCount);
        return { candidates: words.map((word) => ({ word, level })), note: `${words.length} random N${level} words.` };
      }
    }
  };

  const handleFind = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready || busy) return;
    setError(null);
    setFound(null);
    try {
      const result = await findWords();
      if (result.candidates.length === 0) setError(result.note);
      else setFound(result);
    } catch (err) {
      console.error('Finding words failed', err);
      setError(errorMessage(err));
    } finally {
      setProgress(null);
    }
  };

  const handleGenerate = async () => {
    if (!found || busy) return;
    const levels = new Map(found.candidates.flatMap((c) => (c.level ? [[c.word, c.level] as const] : [])));
    const batches = batchByLevel(
      found.candidates.map((c) => c.word),
      levels,
    );

    setError(null);
    const made: Flashcard[] = [];
    try {
      for (const [index, batch] of batches.entries()) {
        setProgress(
          batches.length > 1 ? `Writing flashcards (batch ${index + 1} of ${batches.length})…` : 'Writing flashcards…',
        );
        const cards = await generateFlashcards(batch.words, batch.level);
        made.push(...cards);
        addCards(cards);
      }
      setFound(null);
    } catch (err) {
      console.error('Flashcard generation failed', err);
      setError(
        made.length
          ? `Created ${made.length} cards, but the rest failed: ${errorMessage(err)}`
          : errorMessage(err),
      );
    } finally {
      setCreated(uniqueByWord(made));
      setProgress(null);
    }
  };

  const removeCandidate = (word: string) =>
    setFound((current) => {
      if (!current) return current;
      const candidates = current.candidates.filter((c) => c.word !== word);
      return candidates.length ? { ...current, candidates } : null;
    });

  const usesLevel = source !== 'list';

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
        <form onSubmit={handleFind} className="space-y-9">
          {meta?.demoMode && <DemoBanner onCreatePage />}

          <ChoiceGroup<WordSource>
            legend="Source · 単語の出典"
            value={source}
            onChange={(next) => {
              setSource(next);
              setFound(null);
              setError(null);
            }}
            options={[
              { value: 'file', label: 'File' },
              { value: 'url', label: 'Website' },
              { value: 'list', label: 'Word list' },
              { value: 'random', label: 'Random' },
            ]}
          />

          {source === 'file' && (
            <FileDropzone
              file={file}
              onFile={(next, problem) => {
                setFile(next);
                setFound(null);
                setError(problem ?? null);
              }}
            />
          )}

          {source === 'url' && (
            <div>
              <label htmlFor="page-url" className="label block">
                Web page address · URL
              </label>
              <input
                id="page-url"
                type="url"
                inputMode="url"
                placeholder="https://www3.nhk.or.jp/news/easy/"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-2 h-11 w-full rounded-full border border-line bg-surface px-4 text-sm placeholder:text-ink-muted/70 focus:border-ai focus:outline-none"
              />
              <p className="mt-2 text-xs text-ink-muted">
                Articles work best: news, blogs, wikis. The page's main text is read; menus and ads are skipped.
              </p>
            </div>
          )}

          {source === 'list' && (
            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="word-list" className="label">
                  Your words · 単語リスト
                </label>
                <span className="font-mono text-xs text-ink-muted">
                  {parsedList?.words.length ?? 0} / {MAX_LIST_WORDS}
                </span>
              </div>
              <textarea
                id="word-list"
                lang="ja"
                rows={7}
                value={listText}
                onChange={(e) => setListText(e.target.value)}
                placeholder={'勉強\n学校、先生\n環境 (environment)'}
                className="mt-2 w-full rounded-3xl border border-line bg-surface px-5 py-4 font-jp text-base placeholder:text-ink-muted/60 focus:border-ai focus:outline-none"
              />
              <p className="mt-1 text-xs text-ink-muted">
                One per line, or separated by spaces, commas or 、. Notes in brackets are ignored.
              </p>
            </div>
          )}

          {usesLevel && (
            <>
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
              </div>
            </>
          )}

          {error && <Alert tone="error">{error}</Alert>}

          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={!ready || busy}>
            {busy && !found ? (
              <>
                <LoaderCircle aria-hidden className="size-4 animate-spin" strokeWidth={1.75} />
                {progress}
              </>
            ) : (
              <Bilingual en="Find words" ja="単語を探す" />
            )}
          </Button>
        </form>

        <section ref={resultsRef} aria-labelledby="created-heading" aria-live="polite" className="scroll-mt-24">
          {found ? (
            <>
              <h2 id="created-heading" className="label">
                Review words · 単語の確認
              </h2>
              <p className="mt-3 text-sm text-ink-muted">{found.note} Remove any you don&apos;t want.</p>
              <div className="mt-5">
                <CandidateChips candidates={found.candidates} onRemove={removeCandidate} />
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" onClick={handleGenerate} disabled={busy}>
                  {busy ? (
                    <>
                      <LoaderCircle aria-hidden className="size-4 animate-spin" strokeWidth={1.75} />
                      {progress}
                    </>
                  ) : (
                    <Bilingual en={`Generate ${found.candidates.length} flashcards`} ja="カードを作る" />
                  )}
                </Button>
                {!busy && (
                  <Button variant="ghost" onClick={() => setFound(null)}>
                    Start over
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <h2 id="created-heading" className="label">
                New cards · 新しいカード
              </h2>
              {created.length === 0 ? (
                <div className="mt-4 rounded-3xl border border-dashed border-line px-6 py-16 text-center text-sm text-ink-muted">
                  Find words from a file, a web page or your own list. You can review them before any cards are made.
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
            </>
          )}
        </section>
      </div>
    </>
  );
}
