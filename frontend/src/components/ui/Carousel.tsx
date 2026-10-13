import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, type ReactNode } from 'react';

/** Minimal accessible carousel with a "1 / 3" counter, in the style of nossara.com. */
export function Carousel({ label, slides }: { label: string; slides: readonly ReactNode[] }) {
  const [index, setIndex] = useState(0);
  const go = (delta: number) => setIndex((i) => (i + delta + slides.length) % slides.length);

  return (
    <section aria-roledescription="carousel" aria-label={label}>
      <div aria-live="polite" role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${slides.length}`}>
        {/* Re-mounting resets per-slide state, e.g. a flipped card. */}
        <div key={index}>{slides[index]}</div>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <span className="font-mono text-xs text-ink-muted">
          {index + 1} / {slides.length}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous"
            className="rounded-full p-2 text-ink-soft hover:bg-ink/5"
          >
            <ChevronLeft className="size-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next"
            className="rounded-full p-2 text-ink-soft hover:bg-ink/5"
          >
            <ChevronRight className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </section>
  );
}
