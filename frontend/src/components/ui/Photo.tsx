import clsx from 'clsx';
import type { ReactNode } from 'react';
import { coverSizes, photo, type PhotoName } from '../../lib/photos';

type Overlay = 'none' | 'soft' | 'frame' | 'dark' | 'darker' | 'wash';

const overlays: Record<Exclude<Overlay, 'none'>, string> = {
  // Nossara-style darkening so light text stays readable on photos.
  soft: 'bg-gradient-to-t from-black/45 via-black/10 to-transparent',
  // Darkens top and bottom edges for text in both corners (logo and caption).
  frame: 'bg-gradient-to-b from-black/50 via-transparent via-40% to-black/45',
  dark: 'bg-gradient-to-t from-black/60 via-black/30 to-black/25',
  darker: 'bg-black/55',
  // Softens saturated photos toward the paper color for a calm, pastel feel.
  wash: 'bg-paper/25 mix-blend-soft-light',
};

interface PhotoProps {
  name: PhotoName;
  /**
   * Width of the frame for the browser's size choice, e.g. "(min-width: 768px) 50vw, 100vw".
   * For fixed-height frames, include the height-driven width, e.g. "max(100vw, 123vh)".
   */
  sizes?: string;
  /** Frame aspect ratio (width / height) when it differs from the photo's, e.g. 4 / 5. */
  frameRatio?: number;
  /** Above-the-fold images load eagerly with high priority. */
  priority?: boolean;
  overlay?: Overlay;
  /** Decorative photos next to text that already says the same thing. */
  decorative?: boolean;
  className?: string;
  imgClassName?: string;
  children?: ReactNode;
}

export function Photo({
  name,
  sizes = '100vw',
  frameRatio,
  priority = false,
  overlay = 'none',
  decorative = false,
  className,
  imgClassName,
  children,
}: PhotoProps) {
  const source = photo(name);
  return (
    <div className={clsx('relative overflow-hidden bg-raised', className)}>
      <picture>
        <source
          type="image/avif"
          srcSet={source.avifSrcSet}
          sizes={frameRatio ? coverSizes(sizes, source.ratio, frameRatio) : sizes}
        />
        <img
          src={source.fallback}
          alt={decorative ? '' : source.alt}
          width={source.width}
          height={source.height}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          className={clsx('h-full w-full object-cover dark:brightness-[.9]', imgClassName)}
          style={{ objectPosition: source.position }}
        />
      </picture>
      {overlay !== 'none' && <div aria-hidden className={clsx('absolute inset-0', overlays[overlay])} />}
      {children && <div className="absolute inset-0">{children}</div>}
    </div>
  );
}
