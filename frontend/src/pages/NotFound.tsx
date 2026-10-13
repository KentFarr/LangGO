import { Bilingual, ButtonLink } from '../components/ui/Button';
import { Photo } from '../components/ui/Photo';

export default function NotFound() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-32 pb-24 sm:px-8 md:grid-cols-2">
      <div>
        <p className="font-mono text-sm text-ink-muted">404</p>
        <p lang="ja" className="label mt-6 tracking-normal normal-case">
          ページが見つかりません
        </p>
        <h1 className="mt-2 text-4xl sm:text-5xl">Page not found</h1>
        <p className="mt-4 text-ink-muted">The page you are looking for doesn&apos;t exist or has moved.</p>
        <ButtonLink to="/" className="mt-8">
          <Bilingual en="Back to home" ja="ホームへ" />
        </ButtonLink>
      </div>
      <Photo name="fuji-roofs" sizes="(min-width: 768px) 50vw, 100vw" className="aspect-4/3 rounded-[40px]" />
    </section>
  );
}
