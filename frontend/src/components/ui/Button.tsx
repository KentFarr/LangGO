import clsx from 'clsx';
import type { ComponentProps, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';

type Variant = 'primary' | 'secondary' | 'ghost' | 'inverse' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-display font-medium tracking-tight ' +
  'transition-colors duration-200 disabled:pointer-events-none disabled:opacity-45 select-none';

const variants: Record<Variant, string> = {
  primary: 'bg-ai text-on-ai hover:bg-ai/90',
  secondary: 'border border-ink/25 text-ink hover:border-ink hover:bg-ink/5',
  ghost: 'text-ink-soft hover:bg-ink/5 hover:text-ink',
  // For use on top of photos.
  inverse: 'bg-[#fffefa] text-[#1a1a1a] hover:bg-[#fffefa]/85',
  danger: 'border border-shu/40 text-shu hover:bg-shu/10',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-[15px]',
};

interface StyleProps {
  variant?: Variant;
  size?: Size;
}

function buttonClasses({ variant = 'primary', size = 'md' }: StyleProps = {}, extra?: string) {
  return clsx(base, variants[variant], sizes[size], extra);
}

export function Button({
  variant,
  size,
  className,
  type = 'button',
  ...props
}: ComponentProps<'button'> & StyleProps) {
  return <button type={type} className={buttonClasses({ variant, size }, className)} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: LinkProps & StyleProps) {
  return <Link className={buttonClasses({ variant, size }, className)} {...props} />;
}

/** English label with a smaller Japanese companion, e.g. "Get started はじめる". */
export function Bilingual({ en, ja, className }: { en: ReactNode; ja: string; className?: string }) {
  return (
    <span className={clsx('inline-flex items-baseline gap-1.5', className)}>
      <span>{en}</span>
      <span lang="ja" className="text-[0.82em] font-normal opacity-70">
        {ja}
      </span>
    </span>
  );
}
