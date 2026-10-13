# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

"LangGo": a Japanese vocabulary flashcard app. Users upload a PDF (or pick random words), the app finds JLPT-level words in it, OpenAI generates mnemonic flashcards, and cards are reviewed with a simple spaced-repetition scheme. See `README.md` for the user-facing description.

- `frontend/`: Vite + React 19 + TypeScript (React Router 8, Tailwind CSS 4, lucide-react, Better Auth React client, pdfjs-dist).
- `backend/`: Express 5 + TypeScript (ESM, NodeNext), Better Auth, Drizzle ORM on PostgreSQL, OpenAI SDK, Zod.

The two packages are independent (separate `package.json`/lockfile, no workspace). Node 24 (`.nvmrc`). There is no Firebase anymore.

## Commands

Run in `frontend/` or `backend/`; both have the same script names.

```sh
npm run dev         # frontend: Vite on :3000 (proxies /api -> :5000); backend: tsx watch on :5000, loads .env
npm run build       # frontend -> dist/; backend -> dist/ (tsc -p tsconfig.build.json)
npm test            # Vitest (frontend: jsdom + Testing Library; backend: Supertest + PGlite)
npx vitest run test/integration.test.ts   # single file
npm run lint        # ESLint flat config
npm run typecheck

# backend only
npm run db:generate     # drizzle-kit: new SQL migration in backend/drizzle/ after editing src/db/schema.ts
npm run auth:generate   # regenerate src/db/auth-schema.ts (Better Auth tables) via scripts/auth-cli.config.ts

docker compose up -d db     # Postgres for local dev (localhost:5433, override with DB_PORT; user/db/password: langgo)
docker compose up --build   # full stack on host port 3001
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build   # production (see docs/DEPLOYMENT.md)
```

**Production** (`docker-compose.prod.yml` overlay, guide in `docs/DEPLOYMENT.md`): Caddy (`deploy/Caddyfile`) terminates HTTPS and is the only service with published ports (`ports: !reset []` on app/db, because Docker-published ports bypass ufw). It sets `TRUST_PROXY_HOPS=1` and `BETTER_AUTH_URL=https://$DOMAIN`, and a `backup` service runs `deploy/backup.sh` (daily `pg_dump` into `./backups`). Compose-level vars (`DOMAIN`, `ACME_EMAIL`, `POSTGRES_PASSWORD`, `BACKUP_KEEP_DAYS`) live in the repo-root `.env` (`.env.example`); app secrets live in `backend/.env`.

CI (`.github/workflows/ci.yml`) runs lint, typecheck, test, and build for both packages. Backend tests need no Docker: integration tests use PGlite (in-process Postgres) with the real migrations.

## Architecture

**Serving model.** In production Express serves the built frontend from `public/` next to `dist/` with a `/{*splat}` SPA fallback; the Dockerfile copies `frontend/dist` there and `backend/drizzle` to `/app/drizzle`. Unknown `/api/*` routes return a JSON 404. The frontend uses relative URLs (same-origin in prod, Vite proxy in dev), so session cookies just work.

**Backend.** `src/app.ts` exports `createApp(deps)` with injected `getUserId`, `MnemonicGenerator`, `FlashcardRepository`, and optional Better Auth `authHandler`; `src/server.ts` wires real implementations. `connectDatabase` (`src/db/client.ts`) runs drizzle migrations on startup.
- Order matters in `app.ts`: Better Auth is mounted at `/api/auth/{*splat}` **before** `express.json()` (it parses its own body). The wrapper overwrites the `x-langgo-client-ip` header with `req.ip` because Better Auth's rate limiter reads the IP from headers only; `TRUST_PROXY_HOPS` sets Express `trust proxy`.
- `/api/flashcards` chain: `requireTrustedOrigin` (rejects non-GET with a foreign Origin) → `requireAuth` (sets `res.locals.userId`) → router. Routes: `GET /`, `POST /` (generate; per-user rate limit), `POST /:id/review`, `DELETE /:id`. Invalid UUIDs are 404 without hitting the DB.
- Repository (`services/flashcardRepository.ts`) scopes every query by `userId`; reviews use `SELECT … FOR UPDATE` in a transaction. Scheduling logic (`domain/flashcard.ts`: double on success, halve with a minimum of 1 on failure) exists only on the server.
- `errorHandler` exposes only errors with `expose: true` (body-parser style, or `HttpError` from `src/errors.ts`); anything else (including raw OpenAI SDK errors that carry a `status`) becomes a generic 500. The OpenAI generator catches `OpenAI.APIError`, logs one line (status/code/request id), and throws `HttpError(503, …)`.
- **Demo mode:** when `OPENAI_API_KEY` is empty, `server.ts` uses `createDemoMnemonicGenerator` (`services/demoGenerator.ts`: hand-written `SAMPLE_CARDS` per JLPT level, placeholders for other words). `GET /api/meta` reports `{ demoMode, sampleWords }`; the dashboard shows a banner, and "Random words" samples from `sampleWords` so cards are complete. Sample words must exist in the matching frontend word list level.

**Data model.** Better Auth tables (`user`, `session`, `account`, `verification`) are generated into `src/db/auth-schema.ts`; don't hand-edit them, rerun `auth:generate`. `flashcard` table: one row per card (`user_id` FK with cascade, `source` enum `requested|related`, `review_interval`, `next_review_at`, index on `(user_id, next_review_at)`). The API returns `nextReviewDate`/`createdAt` as ISO strings.

**Frontend.**

- Styling is **Tailwind CSS v4** (`@tailwindcss/vite`). Design tokens (colors, fonts) live in `src/index.css` under `@theme`; `.dark` redefines the same variables, so most components need no `dark:` variants. Palette follows nossara.com (warm off-white, sand, indigo `ai`) plus pastel JLPT colors (`lib/levels.ts`). Fonts are self-hosted via `@fontsource` (DM Sans display, Inter body, Noto Sans JP, Fragment Mono for numbers) so the CSP stays `'self'`.
- Dark mode: `public/theme-init.js` (external, not inline, for CSP) sets `.dark` before paint; `lib/theme.ts` + `ThemeToggle` cycle system/light/dark (localStorage `langgo-theme`).
- UI primitives in `components/ui/` (`Button`/`ButtonLink`/`Bilingual`, `Photo`, `Feedback` (Alert/Spinner/ProgressBar/EmptyState), `Form` (TextField/ChoiceGroup), `LevelBadge`, `Carousel`). UI labels are bilingual (English + small Japanese, `lang="ja"`).
- Routes (`App.tsx`): public pages under `components/layout/PublicLayout` (header floats over the landing hero); `/login` and `/signup` use `AuthSplit`; `/dashboard`, `/review`, `/create`, `/library` are lazy-loaded inside `ProtectedRoute` → `FlashcardsProvider` → `AppShell` (top nav + mobile tab bar).
- `flashcards/FlashcardsProvider.tsx` wraps `hooks/useFlashcards.ts` and `/api/meta`; pages read it with `useDeck()` (`flashcards/context.ts`). Tests render pages with `FlashcardsContext` + `test/fixtures.ts`.
- **Create page sources** (`pages/Create.tsx`): File, Website, Word list, Random. Every source produces candidate words shown as removable chips before generation; generation runs in batches of ≤20 grouped by JLPT level (`lib/wordList.ts` `batchByLevel`). File readers live in `lib/extractors.ts` (PDF via pdf.js, EPUB/DOCX unzipped with `fflate` and parsed with `DOMParser`, SRT/VTT stripped, text decoded UTF-8 → Shift_JIS fallback; furigana `<rt>` removed). Websites go through the API: `POST /api/extract-url` (`backend/src/services/pageFetcher.ts`, Readability + linkedom). The fetcher is the SSRF boundary: http(s) + default ports only, every resolved IP must be public unicast (checked in the socket's DNS `lookup`, so DNS rebinding can't bypass it), redirects re-validated per hop, 10 s / 2 MB caps, HTML/text only. Keep those guarantees if you touch it; tests in `backend/test/pageFetcher.test.ts`.
- **Anki export**: `POST /api/flashcards/export { format: 'apkg' | 'csv', ids? }` (`backend/src/services/ankiExport.ts`). The `.apkg` is a zip of a schema-v11 SQLite collection built with Node's built-in `node:sqlite` plus `fflate`; note guids/ids derive from card UUIDs so re-imports update notes (Anki updates when the incoming note is newer). CSV targets Anki's Basic note type via `#notetype`/`#deck`/`#columns` headers. Both were verified by importing with the real Anki library (`python3 -c 'import anki'` works on the dev machine); tests pin the structure. The Library page exports the currently filtered cards.
- Pure logic with unit tests: `lib/stats.ts` (due/soon/mastered/by level), `lib/reviewQueue.ts` (review session reducer: Space flips, 1/2 grade), `lib/filters.ts` (library search/filters), `lib/wordList.ts` (paste parsing, level batching), `lib/words.ts` (PDF word matching: substring counting over whitespace-stripped text; word lists lazy-imported per level).
- Photos: `scripts/optimize-photos.sh <originals dir>` writes metadata-free AVIF (640/1280, +1920 for full-bleed) + JPEG 1280 fallbacks into `src/assets/photos/`; `lib/photos.ts` registers them (alt text, crop position) and `ui/Photo` renders `<picture>`. Originals are not committed.
- `lib/authClient.ts` is the Better Auth client; `auth/AuthProvider.tsx` exposes `{ user, loading }`. No email verification or password reset (deliberately out of scope).

## Configuration

Backend env (`backend/.env.example`): `DATABASE_URL`, `BETTER_AUTH_SECRET` (≥32 chars), `BETTER_AUTH_URL` (public URL the browser uses: `http://localhost:3000` in dev; compose sets it to `PUBLIC_URL`, default `http://localhost:3001`), `TRUSTED_ORIGINS` (extra, comma-separated), `OPENAI_API_KEY`, `OPENAI_MODEL` (default `gpt-4o-mini`; empty `OPENAI_API_KEY` = demo mode), `PORT`, `TRUST_PROXY_HOPS`, `GENERATE_RATE_LIMIT`. Config is validated by Zod at startup (`src/config.ts`). The frontend needs no env vars.

TypeScript is pinned to `~6.0` because typescript-eslint does not support TS 7 yet.
