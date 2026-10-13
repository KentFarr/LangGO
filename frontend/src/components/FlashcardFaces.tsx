import clsx from 'clsx';
import type { Flashcard } from '../types/flashcard';
import { LevelBadge } from './ui/LevelBadge';

type CardContent = Pick<Flashcard, 'word' | 'reading' | 'meaning' | 'mnemonic'> & {
  level?: number | null;
  source?: Flashcard['source'];
};

export function CardFront({ card, large = false }: { card: CardContent; large?: boolean }) {
  return (
    <>
      <div className="flex items-center justify-between">
        {card.level !== undefined ? <LevelBadge level={card.level} /> : <span />}
        {card.source === 'related' && <span className="label">Related 関連</span>}
      </div>
      <div className="flex flex-1 items-center justify-center">
        <p lang="ja" className={clsx('font-jp font-light text-ink', large ? 'text-6xl sm:text-7xl' : 'text-5xl')}>
          {card.word}
        </p>
      </div>
      <p className="text-center text-xs text-ink-muted">Tap or press Space to reveal</p>
    </>
  );
}

export function CardBack({ card, large = false }: { card: CardContent; large?: boolean }) {
  return (
    <div className="my-auto flex flex-col items-center gap-3 text-center">
      {card.reading && (
        <p lang="ja" className={clsx('font-jp text-ink-soft', large ? 'text-2xl' : 'text-xl')}>
          {card.reading}
        </p>
      )}
      {card.meaning && (
        <p className={clsx('font-display font-medium tracking-tight', large ? 'text-2xl' : 'text-lg')}>
          {card.meaning}
        </p>
      )}
      <p className={clsx('max-w-prose text-ink-soft', large ? 'text-base' : 'text-sm')}>{card.mnemonic}</p>
    </div>
  );
}
