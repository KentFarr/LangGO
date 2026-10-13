import { ArrowDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../auth/useAuth';
import { CardBack, CardFront } from '../components/FlashcardFaces';
import FlipCard from '../components/FlipCard';
import { Bilingual, ButtonLink } from '../components/ui/Button';
import { Carousel } from '../components/ui/Carousel';
import { Photo } from '../components/ui/Photo';
import { LEVELS } from '../lib/levels';
import type { PhotoName } from '../lib/photos';

const KEYWORDS = [
  { ja: 'PDFから単語を抽出', en: 'Words pulled from your PDFs' },
  { ja: 'AIによる語呂合わせ', en: 'Mnemonics written by AI' },
  { ja: '間隔反復で復習', en: 'Spaced-repetition reviews' },
  { ja: 'JLPT N5〜N1', en: 'Every JLPT level' },
];

const SAMPLE_CARDS = [
  {
    word: '勉強',
    reading: 'べんきょう',
    meaning: 'study',
    mnemonic: 'BEN in KYOTO hits the books every night to STUDY: べんきょう.',
    level: 5,
  },
  {
    word: '約束',
    reading: 'やくそく',
    meaning: 'promise',
    mnemonic: 'A YAK in SOCKs PROMISES never to take them off: やくそく.',
    level: 4,
  },
  {
    word: '環境',
    reading: 'かんきょう',
    meaning: 'environment',
    mnemonic: 'CAN KYOTO protect its ENVIRONMENT? かんきょう.',
    level: 3,
  },
];

const STEPS: { label: string; ja: string; title: string; body: string; photo: PhotoName }[] = [
  {
    label: '01 · Upload',
    ja: '読み込む',
    title: 'Start from real text',
    body: 'Choose a Japanese PDF (an article, a menu, a story). It is read in your browser and never uploaded.',
    photo: 'kanji-shutters',
  },
  {
    label: '02 · Discover',
    ja: '見つける',
    title: 'Find the words that matter',
    body: 'The text is matched against JLPT word lists, and the words that appear most at your level are picked.',
    photo: 'pagoda',
  },
  {
    label: '03 · Remember',
    ja: '覚える',
    title: 'Get memorable cards',
    body: 'Each word gets its reading, meaning and a mnemonic, plus related words to grow your vocabulary.',
    photo: 'fuji-roofs',
  },
  {
    label: '04 · Review',
    ja: '復習する',
    title: 'Review at the right time',
    body: 'Cards come back just as you are about to forget them. A few minutes a day is enough.',
    photo: 'fuji-garden',
  },
];

const STACK = ['React 19', 'TypeScript', 'Tailwind CSS', 'Express 5', 'PostgreSQL', 'Drizzle', 'Better Auth', 'OpenAI'];

function TextLink({ to, en, ja }: { to: string; en: string; ja: string }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-2 border-b border-ink/30 pb-1 font-display text-xs font-medium tracking-label uppercase hover:border-ink"
    >
      {en}
      <span lang="ja" className="tracking-normal normal-case opacity-70">
        {ja}
      </span>
      <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
    </Link>
  );
}

export default function Home() {
  const { user } = useAuth();
  const startTo = user ? '/dashboard' : '/signup';

  return (
    <>
      {/* Hero */}
      <section className="relative">
        <Photo name="torii-fuji" priority vivid overlay="dark" sizes="100vw" className="h-[92svh] min-h-140" />
        <div className="absolute inset-0 flex flex-col justify-end text-[#fffefa]">
          <div className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8 sm:pb-24">
            <p className="font-display text-xs font-medium tracking-label uppercase opacity-85">
              Japanese vocabulary, from real text
            </p>
            <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] font-light uppercase sm:text-6xl lg:text-7xl">
              Read real Japanese. Remember it.
            </h1>
            <p lang="ja" className="mt-5 font-jp text-xl font-light tracking-wide opacity-90">
              読んで、覚える。
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink to={startTo} size="lg" variant="inverse">
                <Bilingual en="Get started" ja="はじめる" />
              </ButtonLink>
              <a
                href="#how-it-works"
                className="inline-flex h-13 items-center gap-2 rounded-full border border-[#fffefa]/50 px-6 text-[15px] hover:bg-[#fffefa]/10"
              >
                How it works <ArrowDown aria-hidden className="size-4" strokeWidth={1.5} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Intro + sample cards */}
      <section className="mx-auto grid max-w-6xl gap-14 px-5 py-24 sm:px-8 md:grid-cols-2 md:py-32">
        <div>
          <p className="label">About LangGo · LangGoについて</p>
          <h2 className="mt-4 text-3xl leading-tight sm:text-4xl">
            Textbooks teach words in a vacuum. LangGo starts from the Japanese you actually want to read.
          </h2>
          <ul className="mt-10 divide-y divide-line border-y border-line">
            {KEYWORDS.map((keyword) => (
              <li key={keyword.ja} className="flex flex-col gap-0.5 py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <span lang="ja" className="font-jp text-lg font-light">
                  {keyword.ja}
                </span>
                <span className="text-sm text-ink-muted sm:text-right">{keyword.en}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:pt-16">
          <p className="label mb-4">Sample cards · カードの例</p>
          <Carousel
            label="Sample flashcards"
            slides={SAMPLE_CARDS.map((card) => (
              <FlipCard
                key={card.word}
                size="lg"
                label={card.word}
                front={<CardFront card={card} large />}
                back={<CardBack card={card} large />}
              />
            ))}
          />
        </div>
      </section>

      {/* How it works: four tiles, like a product grid */}
      <section id="how-it-works" className="scroll-mt-20 border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="label">How it works · 使い方</p>
              <h2 className="mt-4 text-3xl sm:text-4xl">From page to memory</h2>
            </div>
            <TextLink to={startTo} en="Try it" ja="試してみる" />
          </div>
          <ol className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <li key={step.label}>
                <Photo
                  name={step.photo}
                  decorative
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="aspect-4/5"
                />
                <p className="label mt-5">
                  {step.label}{' '}
                  <span lang="ja" className="tracking-normal">
                    · {step.ja}
                  </span>
                </p>
                <h3 className="mt-2 text-xl">{step.title}</h3>
                <p className="mt-2 text-sm text-ink-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Story: real Japanese is everywhere */}
      <section className="bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 sm:px-8 md:grid-cols-[1.25fr_1fr]">
          <div className="grid grid-cols-[1.3fr_1fr] gap-4">
            <Photo name="shinjuku-neon" sizes="(min-width: 768px) 35vw, 60vw" className="aspect-4/5 self-end" />
            <Photo name="doves" sizes="(min-width: 768px) 25vw, 40vw" className="aspect-3/4" />
          </div>
          <div>
            <p className="label">Everyday Japanese · 身近な日本語</p>
            <h2 className="mt-4 text-3xl sm:text-4xl">Real Japanese is everywhere</h2>
            <p className="mt-5 text-ink-muted">
              Shop signs, menus, news articles, song lyrics. The words you meet in the wild are the ones worth learning
              first. LangGo turns any of that text into a focused deck for your level.
            </p>
            <div className="mt-8">
              <TextLink to={startTo} en="Read more" ja="詳しく見る" />
            </div>
          </div>
        </div>
      </section>

      {/* Story: learn from what you read */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 sm:px-8 md:grid-cols-[1fr_1.25fr]">
        <div className="md:order-2">
          <Photo name="pond-reader" sizes="(min-width: 768px) 55vw, 100vw" className="aspect-4/3 rounded-[40px]" />
        </div>
        <div>
          <p className="label">Daily practice · 毎日の練習</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">Learn from what you read</h2>
          <p className="mt-5 text-ink-muted">
            Reviews are quick and focused: one card at a time, flip with the space bar, then press 1 if you forgot or 2 if
            you remembered. Cards you know come back less and less often.
          </p>
          <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-line pt-6">
            {[
              ['1 day', 'first review'],
              ['×2', 'when remembered'],
              ['½', 'when forgotten'],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="font-mono text-2xl">{value}</dd>
                <dd className="mt-1 text-xs text-ink-muted">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Banner */}
      <section className="relative">
        <Photo name="tokyo-skyline" overlay="darker" sizes="100vw" className="h-[60vh] min-h-96" />
        <div className="absolute inset-0 flex items-center justify-center px-5 text-center text-[#fffefa]">
          <div>
            <p lang="ja" className="font-jp text-sm tracking-[0.3em] opacity-85">
              一日五分
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl uppercase sm:text-5xl">Five minutes a day</h2>
            <p className="mx-auto mt-4 max-w-md opacity-85">Small, regular reviews beat long cramming sessions.</p>
            <div className="mt-8">
              <ButtonLink to={startTo} size="lg" variant="inverse">
                <Bilingual en="Start learning" ja="はじめる" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* JLPT index, styled like nossara.com's ITEM / COLOR list */}
      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="label">Levels · レベル</p>
            <h2 className="mt-4 text-3xl sm:text-4xl">Every JLPT level, N5 to N1</h2>
          </div>
          <TextLink to={startTo} en="View all" ja="すべて見る" />
        </div>
        <table className="mt-12 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/80">
              <th scope="col" className="label pb-3 font-medium">
                Level
              </th>
              <th scope="col" className="label hidden pb-3 font-medium sm:table-cell">
                Description
              </th>
              <th scope="col" className="label pb-3 text-right font-medium">
                Example
              </th>
            </tr>
          </thead>
          <tbody>
            {LEVELS.map((info) => (
              <tr key={info.label} className="border-b border-line">
                <td className="py-5">
                  <span className="flex items-center gap-3">
                    <span aria-hidden className={`size-3 rounded-full ${info.dot}`} />
                    <span className="font-mono">{info.label}</span>
                  </span>
                </td>
                <td className="hidden py-5 text-ink-muted sm:table-cell">{info.description}</td>
                <td className="py-5 text-right">
                  <span lang="ja" className="font-jp text-base">
                    {info.example.word}
                  </span>
                  <span className="ml-3 text-ink-muted">{info.example.meaning}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Built with */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-20 text-center sm:px-8">
          <p className="label">Built with · 技術</p>
          <p className="mx-auto mt-6 max-w-3xl font-display text-2xl leading-snug font-light sm:text-3xl">
            A full-stack TypeScript app with self-hosted auth, a PostgreSQL database and an AI pipeline that returns
            validated, structured flashcards.
          </p>
          <ul className="mt-10 flex flex-wrap justify-center gap-2">
            {STACK.map((item) => (
              <li key={item} className="rounded-full border border-line px-3.5 py-1.5 font-mono text-xs text-ink-soft">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
