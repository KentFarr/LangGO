import clsx from 'clsx';
import { Suspense, useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../auth/useAuth';
import ThemeToggle from '../ThemeToggle';
import { Bilingual, ButtonLink } from '../ui/Button';
import { Spinner } from '../ui/Feedback';
import Logo from './Logo';
import SiteFooter from './SiteFooter';

/** On the landing page the header floats over the hero photo until the page is scrolled. */
function useOverHero() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return pathname === '/' && !scrolled;
}

export default function PublicLayout() {
  const { user } = useAuth();
  const overHero = useOverHero();

  return (
    <>
      <header
        className={clsx(
          'fixed inset-x-0 top-0 z-30 transition-colors duration-300',
          overHero ? 'text-[#fffefa]' : 'border-b border-line bg-paper/90 text-ink backdrop-blur',
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Logo />
          <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            {user ? (
              <ButtonLink to="/dashboard" size="sm" variant={overHero ? 'inverse' : 'primary'}>
                <Bilingual en="Dashboard" ja="ダッシュボード" />
              </ButtonLink>
            ) : (
              <>
                <Link to="/login" className="hidden rounded-full px-3 py-1.5 text-sm hover:bg-current/10 sm:inline-block">
                  <Bilingual en="Log in" ja="ログイン" />
                </Link>
                <ButtonLink to="/signup" size="sm" variant={overHero ? 'inverse' : 'primary'}>
                  <Bilingual en="Sign up" ja="新規登録" />
                </ButtonLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Suspense fallback={<Spinner className="pt-32" />}>
          <Outlet />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
