import clsx from 'clsx';
import { useState, type KeyboardEvent, type ReactNode } from 'react';

interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  /** Accessible name for the card, e.g. the word on its front. */
  label: string;
  /** Rendered below the card; receives whether the back is currently showing. */
  actions?: (flipped: boolean) => ReactNode;
  /** Controlled mode: the parent owns the flipped state (used by the review session). */
  flipped?: boolean;
  onFlip?: () => void;
  size?: 'md' | 'lg';
  className?: string;
}

const face =
  'absolute inset-0 flex flex-col overflow-y-auto rounded-[28px] border border-line p-6 backface-hidden';

export default function FlipCard({
  front,
  back,
  label,
  actions,
  flipped: controlledFlipped,
  onFlip,
  size = 'md',
  className,
}: FlipCardProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const flipped = controlledFlipped ?? internalFlipped;
  const toggle = () => (onFlip ? onFlip() : setInternalFlipped((value) => !value));

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  };

  return (
    <div className={clsx('w-full', className)}>
      <div className={clsx('perspective-distant', size === 'lg' ? 'h-88 sm:h-104' : 'h-72')}>
        <div
          role="button"
          tabIndex={0}
          aria-pressed={flipped}
          aria-label={`${label}: ${flipped ? 'showing answer' : 'showing word'}. Activate to flip.`}
          onClick={toggle}
          onKeyDown={handleKeyDown}
          className={clsx(
            'relative h-full w-full cursor-pointer rounded-[28px] transition-transform duration-500 transform-3d',
            flipped && 'rotate-y-180',
          )}
        >
          <div aria-hidden={flipped} className={clsx(face, 'bg-surface')}>
            {front}
          </div>
          <div aria-hidden={!flipped} className={clsx(face, 'bg-raised rotate-y-180')}>
            {back}
          </div>
        </div>
      </div>
      {actions && <div className="mt-4 flex justify-center gap-2">{actions(flipped)}</div>}
    </div>
  );
}
