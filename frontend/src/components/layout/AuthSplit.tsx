import type { ReactNode } from 'react';
import { photo as photoSource, type PhotoName } from '../../lib/photos';
import ThemeToggle from '../ThemeToggle';
import { Photo } from '../ui/Photo';
import Logo from './Logo';

/** Split-screen frame for log in / sign up: photo on one side, a calm form on the other. */
export default function AuthSplit({
  photo,
  title,
  ja,
  children,
}: {
  photo: PhotoName;
  title: string;
  ja: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen md:grid-cols-[1.05fr_1fr]">
      <Photo
        name={photo}
        priority
        overlay="frame"
        // Full-height panel on desktop: a wide photo renders as wide as the screen is tall × ratio.
        sizes={`(min-width: 768px) max(52vw, ${Math.round(photoSource(photo).ratio * 100)}vh), 100vw`}
        className="h-56 md:sticky md:top-0 md:h-screen"
      >
        <div className="flex h-full flex-col justify-between p-6 text-[#fffefa] sm:p-10">
          <Logo />
          <p lang="ja" className="hidden font-jp text-sm font-light tracking-wide md:block">
            読んで、覚える。
          </p>
        </div>
      </Photo>

      <div className="relative flex items-center justify-center px-6 py-14 sm:px-12">
        <ThemeToggle className="absolute top-5 right-5 text-ink" />
        <div className="w-full max-w-sm">
          <p lang="ja" className="label">
            {ja}
          </p>
          <h1 className="mt-2 text-4xl">{title}</h1>
          <div className="mt-10">{children}</div>
        </div>
      </div>
    </div>
  );
}
