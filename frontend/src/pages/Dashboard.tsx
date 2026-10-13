import clsx from 'clsx';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useRequiredUser } from '../auth/useAuth';
import DemoBanner from '../components/DemoBanner';
import FlashcardGrid from '../components/FlashcardGrid';
import { Bilingual, ButtonLink } from '../components/ui/Button';
import { Alert, EmptyState, Spinner } from '../components/ui/Feedback';
import { Photo } from '../components/ui/Photo';
import { useDeck } from '../flashcards/context';
import { LEVELS } from '../lib/levels';
import { computeStats, formatTimeUntil, MASTERED_INTERVAL_DAYS } from '../lib/stats';

function Stat({ label, ja, value, hint }: { label: string; ja: string; value: number; hint?: string }) {
  return (
    <div className="flex min-h-32 flex-col justify-between rounded-3xl border border-line bg-surface p-5 sm:min-h-40 sm:p-6">
      <p className="label">
        {label}{' '}
        <span lang="ja" className="tracking-normal">
          {ja}
        </span>
      </p>
      <div>
        <p className="mt-4 font-mono text-3xl sm:text-4xl">{value}</p>
        {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const user = useRequiredUser();
  const { cards, status, meta } = useDeck();
  const [now] = useState(() => new Date());

  if (status === 'loading') return <Spinner label="Loading your flashcards…" />;
  if (status === 'error') {
    return <Alert tone="error">Could not load your flashcards. Please refresh the page to try again.</Alert>;
  }

  const stats = computeStats(cards, now);
  const firstName = user.name.split(' ')[0] || user.name;
  const levelTotal = stats.total - stats.unknownLevel;

  return (
    <>
      <p lang="ja" className="label">
        おかえりなさい
      </p>
      <h1 className="mt-2 mb-8 text-4xl">Welcome back, {firstName}</h1>

      {meta?.demoMode && <DemoBanner />}

      {stats.total === 0 ? (
        <div className="grid items-center overflow-hidden rounded-[40px] border border-line bg-surface md:grid-cols-2">
          <Photo name="pond-reader" sizes="(min-width: 768px) 50vw, 100vw" className="aspect-4/3 h-full" />
          <EmptyState
            ja="まだカードがありません"
            title="Create your first flashcards"
            action={
              <ButtonLink to="/create">
                <Bilingual en="Create cards" ja="作成する" />
              </ButtonLink>
            }
          >
            Pick a JLPT level and choose a PDF or random words. Your new cards will show up here for review.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div className="col-span-2 flex flex-col justify-between rounded-3xl bg-sand p-7 lg:col-span-1">
              <p className="label text-ink-soft">
                Reviews due{' '}
                <span lang="ja" className="tracking-normal">
                  復習
                </span>
              </p>
              <p className="mt-4 font-mono text-6xl">{stats.dueNow}</p>
              <p className="mt-1 text-sm text-ink-soft">
                {stats.dueNow > 0
                  ? 'Cards ready to review now.'
                  : stats.nextDueAt
                    ? `All caught up. Next review ${formatTimeUntil(stats.nextDueAt, now)}.`
                    : 'All caught up.'}
              </p>
              <div className="mt-6">
                {stats.dueNow > 0 ? (
                  <ButtonLink to="/review">
                    <Bilingual en="Start review" ja="復習する" />
                  </ButtonLink>
                ) : (
                  <ButtonLink to="/create" variant="secondary">
                    <Bilingual en="Create more cards" ja="作成する" />
                  </ButtonLink>
                )}
              </div>
            </div>
            <Stat label="Total cards" ja="合計" value={stats.total} />
            <Stat label="Due soon" ja="まもなく" value={stats.dueSoon} hint="Within the next 24 hours" />
            <Stat label="Mastered" ja="習得" value={stats.mastered} hint={`Interval ${MASTERED_INTERVAL_DAYS}+ days`} />
          </div>

          <section aria-labelledby="levels-heading" className="mt-4 rounded-3xl border border-line bg-surface p-6">
            <h2 id="levels-heading" className="label font-medium">
              Cards by level{' '}
              <span lang="ja" className="tracking-normal">
                レベル別
              </span>
            </h2>
            <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-raised" aria-hidden>
              {LEVELS.map((info) =>
                stats.byLevel[info.level] > 0 ? (
                  <div
                    key={info.level}
                    className={info.dot}
                    style={{ width: `${(stats.byLevel[info.level] / Math.max(levelTotal, 1)) * 100}%` }}
                  />
                ) : null,
              )}
            </div>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {LEVELS.map((info) => (
                <li key={info.level} className="flex items-center gap-2">
                  <span aria-hidden className={clsx('size-2.5 rounded-full', info.dot)} />
                  <span className="font-mono">{info.label}</span>
                  <span className="text-ink-muted">{stats.byLevel[info.level]}</span>
                </li>
              ))}
              {stats.unknownLevel > 0 && (
                <li className="flex items-center gap-2 text-ink-muted">
                  <span aria-hidden className="size-2.5 rounded-full bg-line" />
                  Older cards {stats.unknownLevel}
                </li>
              )}
            </ul>
          </section>

          <section aria-labelledby="recent-heading" className="mt-14">
            <div className="flex items-end justify-between gap-4">
              <h2 id="recent-heading" className="text-2xl">
                Recent cards{' '}
                <span lang="ja" className="text-sm text-ink-muted">
                  最近のカード
                </span>
              </h2>
              <Link
                to="/library"
                className="inline-flex shrink-0 items-center gap-1.5 text-sm whitespace-nowrap text-ink-soft hover:text-ink"
              >
                View all <span lang="ja">すべて見る</span>
                <ArrowRight aria-hidden className="size-3.5" strokeWidth={1.5} />
              </Link>
            </div>
            <div className="mt-6">
              <FlashcardGrid cards={cards.slice(0, 6)} />
            </div>
          </section>
        </>
      )}
    </>
  );
}
