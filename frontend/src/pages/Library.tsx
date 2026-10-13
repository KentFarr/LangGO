import { Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import FlashcardGrid from '../components/FlashcardGrid';
import { Bilingual, Button, ButtonLink } from '../components/ui/Button';
import { Alert, EmptyState, Spinner } from '../components/ui/Feedback';
import { ChoiceGroup } from '../components/ui/Form';
import { Photo } from '../components/ui/Photo';
import { useDeck } from '../flashcards/context';
import { LEVELS } from '../lib/levels';
import { filterCards, type LevelFilter, type SourceFilter } from '../lib/filters';
import type { Flashcard } from '../types/flashcard';

export default function Library() {
  const { cards, status, remove } = useDeck();
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<LevelFilter>('all');
  const [source, setSource] = useState<SourceFilter>('all');
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => filterCards(cards, { query, level, source }), [cards, query, level, source]);

  if (status === 'loading') return <Spinner label="Loading your library…" />;
  if (status === 'error') return <Alert tone="error">Could not load your flashcards.</Alert>;

  const handleDelete = async (card: Flashcard) => {
    if (!window.confirm(`Delete the flashcard for ${card.word}?`)) return;
    setError(null);
    try {
      await remove(card);
    } catch (err) {
      console.error('Failed to delete flashcard', err);
      setError('Could not delete the flashcard. Please try again.');
    }
  };

  return (
    <>
      <p lang="ja" className="label">
        単語帳
      </p>
      <h1 className="mt-2 text-4xl">
        Library <span className="font-mono text-xl text-ink-muted">{cards.length}</span>
      </h1>

      {cards.length === 0 ? (
        <div className="mt-10 overflow-hidden rounded-[40px] border border-line bg-surface">
          <Photo name="doves" decorative sizes="(min-width: 1152px) 1152px, 100vw" className="aspect-[3/1]" />
          <EmptyState
            ja="まだカードがありません"
            title="Your library is empty"
            action={
              <ButtonLink to="/create">
                <Bilingual en="Create cards" ja="作成する" />
              </ButtonLink>
            }
          >
            Every card you create is kept here, so you can browse, search and tidy up your deck.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-muted"
                strokeWidth={1.5}
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search words, readings, meanings…"
                aria-label="Search flashcards"
                className="h-11 w-full rounded-full border border-line bg-surface pr-4 pl-11 text-sm placeholder:text-ink-muted/80 focus:border-ai focus:outline-none"
              />
            </div>
            <ChoiceGroup<SourceFilter>
              legend="Source"
              className="[&_legend]:sr-only"
              value={source}
              onChange={setSource}
              options={[
                { value: 'all', label: 'All' },
                { value: 'requested', label: 'Requested' },
                { value: 'related', label: 'Related' },
              ]}
            />
          </div>
          <ChoiceGroup<LevelFilter>
            legend="Level"
            className="mt-4 [&_legend]:sr-only"
            value={level}
            onChange={setLevel}
            options={[
              { value: 'all', label: 'All levels' },
              ...LEVELS.map((info) => ({
                value: info.level,
                label: <span className="font-mono">{info.label}</span>,
                selectedClassName: info.bg,
              })),
            ]}
          />

          {error && (
            <Alert tone="error" className="mt-6">
              {error}
            </Alert>
          )}

          <p className="mt-8 mb-5 text-sm text-ink-muted" aria-live="polite">
            Showing {visible.length} of {cards.length} cards
          </p>
          {visible.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-line px-6 py-16 text-center text-sm text-ink-muted">
              No cards match these filters.
            </p>
          ) : (
            <FlashcardGrid
              cards={visible}
              renderActions={(card) => (
                <Button variant="danger" size="sm" onClick={() => handleDelete(card)} aria-label={`Delete ${card.word}`}>
                  <Trash2 aria-hidden className="size-3.5" strokeWidth={1.5} /> Delete
                </Button>
              )}
            />
          )}
        </>
      )}
    </>
  );
}
