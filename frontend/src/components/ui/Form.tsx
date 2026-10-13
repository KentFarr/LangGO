import clsx from 'clsx';
import { useId, type ComponentProps, type ReactNode } from 'react';

/** Label + underlined input, in the minimal style of the auth forms. */
export function TextField({
  label,
  hint,
  className,
  ...props
}: ComponentProps<'input'> & { label: string; hint?: string }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="label block">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={hintId}
        className={clsx(
          'mt-2 block w-full border-0 border-b border-line bg-transparent px-0 py-2 text-base text-ink',
          'placeholder:text-ink-muted/70 focus:border-ai focus:ring-0 focus:outline-none',
        )}
        {...props}
      />
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

interface Option<T extends string | number> {
  value: T;
  label: ReactNode;
  /** Extra classes for the selected state (e.g. a level's pastel). */
  selectedClassName?: string;
}

/** Pill-shaped single-choice group (radio semantics), used for segmented controls and chips. */
export function ChoiceGroup<T extends string | number>({
  legend,
  value,
  options,
  onChange,
  className,
}: {
  legend: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  const name = useId();
  return (
    <fieldset className={className}>
      <legend className="label mb-3">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <label
              key={String(option.value)}
              className={clsx(
                'cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors',
                'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ai',
                selected
                  ? clsx('border-ink text-ink', option.selectedClassName ?? 'bg-sand')
                  : 'border-line text-ink-soft hover:border-ink/40',
              )}
            >
              <input
                type="radio"
                name={name}
                className="sr-only"
                checked={selected}
                onChange={() => onChange(option.value)}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
