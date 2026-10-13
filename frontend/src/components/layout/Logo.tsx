import clsx from 'clsx';
import { Link } from 'react-router';

export default function Logo({ to = '/', className }: { to?: string; className?: string }) {
  return (
    <Link to={to} className={clsx('group inline-flex items-baseline gap-2', className)} aria-label="LangGo home">
      <span className="font-display text-lg font-medium tracking-tight">LangGo</span>
      <span lang="ja" aria-hidden className="text-xs opacity-60 transition-opacity group-hover:opacity-90">
        語学
      </span>
    </Link>
  );
}
