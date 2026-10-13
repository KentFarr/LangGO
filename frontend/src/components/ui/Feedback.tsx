import clsx from 'clsx';
import { CircleAlert, CircleCheck, Info, LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';

type Tone = 'info' | 'success' | 'error';

const tones: Record<Tone, { className: string; icon: typeof Info }> = {
  info: { className: 'bg-sand/70 text-ink', icon: Info },
  success: { className: 'bg-sage text-ink', icon: CircleCheck },
  error: { className: 'bg-sakura text-ink', icon: CircleAlert },
};

export function Alert({
  tone = 'info',
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  const { className: toneClass, icon: Icon } = tones[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={clsx('flex items-start gap-3 rounded-2xl px-4 py-3 text-sm', toneClass, className)}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
      <div>{children}</div>
    </div>
  );
}

export function Spinner({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={clsx('flex items-center justify-center gap-2 py-16 text-ink-muted', className)}>
      <LoaderCircle aria-hidden className="size-4 animate-spin" strokeWidth={1.75} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-1 w-full overflow-hidden rounded-full bg-line"
    >
      <div className="h-full rounded-full bg-ai transition-[width] duration-300" style={{ width: `${percent}%` }} />
    </div>
  );
}

export function EmptyState({
  title,
  ja,
  children,
  action,
}: {
  title: string;
  ja: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <p lang="ja" className="label mb-3">
        {ja}
      </p>
      <h2 className="text-2xl">{title}</h2>
      {children && <div className="mt-3 max-w-md text-ink-muted">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
