import type { ReactNode } from 'react';

function Section({ title, ja, children }: { title: string; ja: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 border-t border-line py-10 md:grid-cols-[220px_1fr] md:gap-10">
      <div>
        <h2 className="text-xl">{title}</h2>
        <p lang="ja" className="label mt-1 tracking-normal normal-case">
          {ja}
        </p>
      </div>
      <div className="space-y-4 text-ink-soft [&_a]:text-ai [&_a]:underline-offset-4 [&_a:hover]:underline">
        {children}
      </div>
    </section>
  );
}

export default function Privacy() {
  return (
    <article className="mx-auto max-w-4xl px-5 pt-32 pb-24 sm:px-8">
      <p lang="ja" className="label">
        プライバシーポリシー
      </p>
      <h1 className="mt-3 text-4xl sm:text-5xl">Privacy policy</h1>
      <p className="mt-6 max-w-2xl text-lg text-ink-muted">
        Your privacy is important to us. This policy explains what information LangGo (
        <a href="https://langgo.co" className="text-ai underline-offset-4 hover:underline">
          langgo.co
        </a>
        ) collects and how it is used.
      </p>

      <div className="mt-14">
        <Section title="What we collect" ja="収集する情報">
          <p>
            To create an account we store your name, email address, and a securely hashed password; we never store your
            password in plain text. The flashcards you generate, along with your review progress, are stored in our
            database so you can come back to them at any time. A session cookie keeps you signed in.
          </p>
        </Section>

        <Section title="Your documents" ja="文書の取り扱い">
          <p>
            Files you choose (PDFs, e-books, documents, subtitles) are read entirely in your browser and are never
            uploaded. If you enter a web page address, our server fetches that page once to read its text and does not
            keep a copy. Only the short list of vocabulary words you confirm is sent to OpenAI to generate mnemonics.
          </p>
        </Section>

        <Section title="Sharing" ja="第三者への提供">
          <p>
            We do not sell your information or share personally identifying information with third parties, except for
            OpenAI as described above, or when required by law.
          </p>
        </Section>

        <Section title="Retention" ja="保存期間">
          <p>
            We keep your data only as long as your account is active. You can delete individual flashcards from your
            library at any time, and you can contact us to have your account and all of its data removed.
          </p>
        </Section>

        <Section title="Contact" ja="お問い合わせ">
          <p>
            Questions or feedback are always welcome. Reach me at{' '}
            <a href="mailto:kentfarabaugh@gmail.com">kentfarabaugh@gmail.com</a>, and if you enjoy LangGo, check out my
            other projects on{' '}
            <a href="https://github.com/KentFarr" target="_blank" rel="noreferrer">
              GitHub
            </a>
            . Thank you for using LangGo!
          </p>
        </Section>
      </div>

      <p className="mt-6 font-mono text-xs text-ink-muted">Last updated: October 2026</p>
    </article>
  );
}
