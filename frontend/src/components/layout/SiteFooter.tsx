import { Link } from 'react-router';
import Logo from './Logo';

const links = [
  { to: '/', en: 'Home', ja: 'ホーム' },
  { to: '/signup', en: 'Sign up', ja: '新規登録' },
  { to: '/login', en: 'Log in', ja: 'ログイン' },
  { to: '/privacy', en: 'Privacy', ja: 'プライバシー' },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.2fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-ink-muted">
            Japanese vocabulary from the text you actually read.
            <span lang="ja" className="mt-1 block">
              読んで、覚える。
            </span>
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {links.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-ink-soft hover:text-ink">
                  {link.en} <span lang="ja" className="text-xs text-ink-muted">{link.ja}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 border-t border-line px-5 py-5 text-xs text-ink-muted sm:px-8">
        <p>© {new Date().getFullYear()} LangGo</p>
        <p>
          Made by{' '}
          <a href="https://kentfarabaugh.com" target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
            Kent Farabaugh
          </a>
        </p>
      </div>
    </footer>
  );
}
