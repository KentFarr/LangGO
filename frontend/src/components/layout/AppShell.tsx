import clsx from 'clsx';
import { BookOpen, LayoutGrid, LogOut, Plus, RotateCcw } from 'lucide-react';
import { Suspense, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { useRequiredUser } from '../../auth/useAuth';
import { useDeck } from '../../flashcards/context';
import { authClient } from '../../lib/authClient';
import { computeStats } from '../../lib/stats';
import ThemeToggle from '../ThemeToggle';
import { Spinner } from '../ui/Feedback';
import Logo from './Logo';

const NAV = [
  { to: '/dashboard', en: 'Dashboard', ja: 'ダッシュボード', icon: LayoutGrid },
  { to: '/review', en: 'Review', ja: '復習', icon: RotateCcw },
  { to: '/create', en: 'Create', ja: '作成', icon: Plus },
  { to: '/library', en: 'Library', ja: '単語帳', icon: BookOpen },
] as const;

function DueBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="ml-1 rounded-full bg-ai px-1.5 py-px font-mono text-[10px] text-on-ai">
      {count > 99 ? '99+' : count}
      <span className="sr-only"> due</span>
    </span>
  );
}

export default function AppShell() {
  const user = useRequiredUser();
  const navigate = useNavigate();
  const { cards } = useDeck();
  // Recomputed with the deck; fine-grained "now" isn't needed for a badge.
  const [now] = useState(() => new Date());
  const due = computeStats(cards, now).dueNow;

  const signOut = async () => {
    await authClient.signOut();
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Logo to="/dashboard" />
          <nav aria-label="App" className="hidden items-center gap-1 md:flex">
            {NAV.map(({ to, en, ja }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx(
                    'rounded-full px-3.5 py-1.5 text-sm transition-colors',
                    isActive ? 'bg-sand text-ink' : 'text-ink-soft hover:bg-ink/5 hover:text-ink',
                  )
                }
              >
                {en}{' '}
                <span lang="ja" className="text-[11px] opacity-60">
                  {ja}
                </span>
                {to === '/review' && <DueBadge count={due} />}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <span className="mr-2 hidden text-sm text-ink-muted lg:inline">{user.name}</span>
            <ThemeToggle className="text-ink" />
            <button
              type="button"
              onClick={signOut}
              className="rounded-full p-2 text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut aria-hidden className="size-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-10 pb-28 sm:px-8 md:pb-16">
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>

      {/* Mobile tab bar */}
      <nav
        aria-label="App"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-4">
          {NAV.map(({ to, en, ja, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  clsx(
                    'flex flex-col items-center gap-0.5 py-2.5 text-[11px]',
                    isActive ? 'text-ai' : 'text-ink-muted',
                  )
                }
              >
                <span className="relative">
                  <Icon aria-hidden className="size-5" strokeWidth={1.5} />
                  {to === '/review' && due > 0 && (
                    <span className="absolute -top-1 -right-2 size-2 rounded-full bg-shu" aria-hidden />
                  )}
                </span>
                <span>{en}</span>
                <span lang="ja" className="sr-only">
                  {ja}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
