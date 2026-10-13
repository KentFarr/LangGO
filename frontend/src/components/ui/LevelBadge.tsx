import clsx from 'clsx';
import { levelInfo } from '../../lib/levels';

export function LevelBadge({ level, className }: { level: number | null; className?: string }) {
  const info = levelInfo(level);
  return (
    <span
      className={clsx(
        'inline-flex h-6 items-center rounded-full px-2.5 font-mono text-[11px] text-ink',
        info ? info.bg : 'bg-raised text-ink-muted',
        className,
      )}
      title={info ? `JLPT ${info.label}` : 'Level not recorded'}
    >
      {info ? info.label : '—'}
    </span>
  );
}
