import { X } from 'lucide-react';
import { useEffect, useReducer, useState } from 'react';
import { Link } from 'react-router';
import { CardBack, CardFront } from '../components/FlashcardFaces';
import FlipCard from '../components/FlipCard';
import { Bilingual, Button, ButtonLink } from '../components/ui/Button';
import { Alert, EmptyState, ProgressBar, Spinner } from '../components/ui/Feedback';
import { useDeck } from '../flashcards/context';
import { currentCardId, isFinished, reviewReducer, startSession, summarize } from '../lib/reviewQueue';
import { computeStats, dueCards, formatTimeUntil } from '../lib/stats';
import type { Flashcard } from '../types/flashcard';

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="ml-1.5 rounded-md border border-current/30 px-1.5 py-px font-mono text-[11px] opacity-80">
      {children}
    </kbd>
  );
}

/** Ignore shortcuts while the user is typing in a field. */
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

function Session({ queue }: { queue: Flashcard[] }) {
  const { review } = useDeck();
  const [session, dispatch] = useReducer(reviewReducer, queue, (cards) => startSession(cards.map((c) => c.id)));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const card = queue.find((c) => c.id === currentCardId(session));
  const finished = isFinished(session);

  const grade = async (remembered: boolean) => {
    if (!card || !session.flipped || pending) return;
    setPending(true);
    setError(null);
    try {
      await review(card, remembered);
      dispatch({ type: 'graded', id: card.id, remembered });
    } catch (err) {
      console.error('Failed to record review', err);
      setError('Could not save your answer. Please try again.');
    } finally {
      setPending(false);
    }
  };

  useEffect(() => {
    if (finished) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      // The card itself handles Space/Enter when it has focus.
      const onCard = event.target instanceof HTMLElement && event.target.getAttribute('role') === 'button';
      if ((event.key === ' ' || event.key === 'Enter') && !onCard) {
        event.preventDefault();
        dispatch({ type: 'flip' });
      } else if (event.key === '1') {
        void grade(false);
      } else if (event.key === '2') {
        void grade(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (finished) {
    const { reviewed, remembered, forgot } = summarize(session);
    return (
      <div className="mx-auto max-w-xl rounded-[40px] border border-line bg-surface">
        <EmptyState
          ja="お疲れさまでした"
          title="Session complete"
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink to="/dashboard">
                <Bilingual en="Back to dashboard" ja="ダッシュボード" />
              </ButtonLink>
              <ButtonLink to="/create" variant="secondary">
                <Bilingual en="Create more" ja="作成" />
              </ButtonLink>
            </div>
          }
        >
          <dl className="mt-4 grid grid-cols-3 gap-6 text-center">
            {[
              ['Reviewed', reviewed],
              ['Remembered', remembered],
              ['Forgot', forgot],
            ].map(([label, value]) => (
              <div key={label}>
                <dd className="font-mono text-3xl text-ink">{value}</dd>
                <dt className="mt-1 text-xs">{label}</dt>
              </div>
            ))}
          </dl>
        </EmptyState>
      </div>
    );
  }

  if (!card) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <span className="shrink-0 font-mono text-sm whitespace-nowrap text-ink-muted">
          {session.index + 1} / {session.queue.length}
        </span>
        <ProgressBar value={session.index} max={session.queue.length} label="Review progress" />
        <Link to="/dashboard" aria-label="End session" className="rounded-full p-1.5 text-ink-muted hover:bg-ink/5 hover:text-ink">
          <X aria-hidden className="size-4" strokeWidth={1.5} />
        </Link>
      </div>

      <FlipCard
        key={card.id}
        size="lg"
        label={card.word}
        flipped={session.flipped}
        onFlip={() => dispatch({ type: 'flip' })}
        front={<CardFront card={card} large />}
        back={<CardBack card={card} large />}
      />

      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="secondary" size="lg" disabled={!session.flipped || pending} onClick={() => grade(false)}>
          Forgot <span lang="ja" className="text-sm opacity-70">忘れた</span>
          <Kbd>1</Kbd>
        </Button>
        <Button size="lg" disabled={!session.flipped || pending} onClick={() => grade(true)}>
          Remembered <span lang="ja" className="text-sm opacity-70">覚えた</span>
          <Kbd>2</Kbd>
        </Button>
      </div>
      <p className="mt-4 text-center text-xs text-ink-muted" aria-live="polite">
        {session.flipped ? 'How did you do?' : 'Recall the reading and meaning, then flip the card.'}{' '}
        <span className="hidden sm:inline">
          Press <Kbd>Space</Kbd> to flip.
        </span>
      </p>
    </div>
  );
}

export default function Review() {
  const { cards, status } = useDeck();
  const [now] = useState(() => new Date());
  // Snapshot the queue once the deck has loaded, so reviewed cards don't reshuffle it.
  const [queue, setQueue] = useState<Flashcard[] | null>(null);
  if (queue === null && status === 'ready') setQueue(dueCards(cards, now));

  if (status === 'loading' || queue === null) {
    if (status === 'error') return <Alert tone="error">Could not load your flashcards.</Alert>;
    return <Spinner label="Preparing your review…" />;
  }

  if (queue.length === 0) {
    const { nextDueAt } = computeStats(cards, now);
    return (
      <div className="mx-auto max-w-xl rounded-[40px] border border-line bg-surface">
        <EmptyState
          ja="復習するカードはありません"
          title="You're all caught up"
          action={
            <ButtonLink to="/create" variant="secondary">
              <Bilingual en="Create cards" ja="作成する" />
            </ButtonLink>
          }
        >
          {nextDueAt
            ? `Your next review is ${formatTimeUntil(nextDueAt, now)}.`
            : 'Create some flashcards and they will appear here when they are due.'}
        </EmptyState>
      </div>
    );
  }

  return (
    <>
      <h1 className="sr-only">Review</h1>
      <Session queue={queue} />
    </>
  );
}
