# LangGo roadmap

What's planned after the current release, in the recommended order. Effort is a rough estimate
for one developer (S ≈ 1–2 days, M ≈ 3–5 days, L ≈ 1–2 weeks).

**Shipped:** PostgreSQL + Better Auth, demo mode, VPS deployment, redesign with dark mode, focused
review sessions, word lists / files (PDF, EPUB, DOCX, TXT, HTML, SRT/VTT) / web pages as sources,
and Anki export.

| # | Item | Status | Effort |
|---|------|--------|--------|
| 0 | [Launch checklist](#0-launch-checklist) | Before going live | M |
| 1 | [Grammar cards](#1-grammar-cards) | Next | L |
| 2 | [YouTube links](#2-youtube-links) | Covered by subtitle upload; link support optional | S–M |
| 3 | [AI chat tutor](#3-ai-chat-tutor) | Later | L |
| 4 | [Bunpro integration](#4-bunpro-integration) | Blocked on an official API | M |

---

## 0. Launch checklist

Not features, but worth doing before real users arrive.

- **Account deletion and data download.** The privacy page promises account removal on request;
  a self-service "Delete my account" (cascades to cards via the existing foreign keys) and a
  "Download my data" (the Anki/CSV export already covers cards) make that promise real.
- **Password reset.** Needs an email provider (e.g. Postmark, Resend, Amazon SES). Better Auth has
  built-in `sendResetPassword`; add the matching pages. Email verification can use the same
  provider.
- **Enforce the Content-Security-Policy.** It ships in report-only mode. Check the browser console
  on the deployed site for violations, then set `reportOnly: false` in `backend/src/app.ts`.
- **Error monitoring.** A hosted error tracker (e.g. Sentry, GlitchTip self-hosted) for both
  frontend and backend, with PII scrubbing.
- **Off-server backups.** The `backup` service keeps dumps on the VPS; add a scheduled copy to
  object storage (OVHcloud Object Storage or similar).
- **OpenAI budget.** Set a hard monthly limit in the OpenAI dashboard; review
  `GENERATE_RATE_LIMIT` once there's real usage.
- **Terms of use** page alongside the privacy policy.
- **Word list provenance.** The origin of `frontend/src/data/*.json` isn't documented. Rebuild
  the lists from a clearly licensed source (e.g. Jonathan Waller's CC BY JLPT lists) with a
  small, committed script, credit the source, and keep the script so the data is reproducible.

## 1. Grammar cards

**Goal:** study grammar points (e.g. 〜ながら, 〜ばかり) with the same review flow as vocabulary.

**Data model**
- Add `kind` (`vocab` | `grammar`, default `vocab`) to `flashcard`, plus a nullable `details`
  JSONB column for grammar-specific content:
  `{ pattern, formation, explanation, examples: [{ ja, reading, en }] }`.
- Existing columns map naturally: `word` = the pattern (e.g. 〜ながら), `meaning` = short gloss,
  `mnemonic` = memory hook. `level` and scheduling are unchanged.

**Sources**
- *From text:* ask the model to identify grammar points used in a passage (from the existing
  file/web/list extractors), constrained to the chosen JLPT level, returned as structured output
  like today's vocab cards.
- *From a list:* a curated JLPT grammar list per level, like the vocab lists. **Open question:**
  find a list whose license permits redistribution (many online lists don't); otherwise rely on
  model detection plus user-typed patterns.

**API / UI**
- `POST /api/flashcards` gains `kind`; a second Zod schema and prompt for grammar generation.
- Create page: a Vocabulary / Grammar toggle above the sources.
- Card back for grammar: formation, explanation, and 2–3 example sentences (furigana via
  `<ruby>`). An optional cloze mode ("fill in the blank") for review later.
- Library: a kind filter. Anki export: a second note type, "LangGo Grammar".

**Testing:** schema migration, generation route (fake generator), rendering of grammar faces,
Anki export of both note types (verify with the real Anki importer as before).

## 2. YouTube links

**Today:** users download a video's subtitles (.srt/.vtt) and drop them on the File source. This
is free and stays within YouTube's terms.

**Optional upgrade:** paste a YouTube link directly.
- YouTube has **no official API for reading a video's captions** unless you own the video, and
  its terms prohibit scraping. Unofficial libraries break when YouTube changes and can get the
  server's IP blocked, so they're not suitable for production.
- The viable route is a **paid transcript provider** behind a `TRANSCRIPT_API_KEY`: a
  `POST /api/extract-youtube` that validates the video id, calls the provider, and returns text
  to the existing word-matching flow (same shape as `/api/extract-url`). Hide the option when the
  key isn't configured.
- **Decide before building:** provider choice, cost per transcript, and their terms.

## 3. AI chat tutor

**Goal:** a practice area where you chat in Japanese with an AI that adapts to your level, gives
short lessons and corrections, and can turn words or phrases from the conversation into cards.

**Data model**
- `conversation` (id, user_id, title, created_at) and `message` (id, conversation_id, role,
  content, created_at). Optionally a `saved_phrase` table for a "phrasebook" section, or reuse
  `flashcard` with `source = 'tutor'`.
- `usage` (user_id, day, input_tokens, output_tokens) for per-user budgets.

**Backend**
- `POST /api/tutor/conversations/:id/messages` streams the reply with Server-Sent Events from
  the OpenAI Responses API (streaming).
- System prompt includes the user's level and a sample of words they're learning (from their
  deck) so lessons reuse known vocabulary; modes such as "free conversation", "drill my due
  words" and "explain this grammar".
- **Tool calling:** the model can call `suggest_flashcard({ word, reading, meaning, mnemonic })`;
  suggestions appear as "Add to deck" chips that the user confirms. Nothing is saved without
  a click.
- **Cost and safety controls:** per-user daily token budget, history truncation/summarization,
  rate limits, OpenAI moderation on user input, and a demo-mode tutor with scripted replies.

**Frontend**
- `/tutor` page in the app shell: conversation list, chat view with streaming text, furigana
  toggle, Japanese IME-friendly input (don't send on Enter while composing:
  `compositionstart`/`compositionend`), and the suggested-card chips.

**Testing:** route tests with a fake streaming model, budget enforcement, tool-call → suggestion
→ save flow, IME composition handling in the input.

## 4. Bunpro integration

**Status: blocked.** Bunpro currently has **no official public API**. Its old API was deprecated
and its docs removed, and the only reference is a community, reverse-engineered one that can
change without notice. Building on undocumented endpoints with users' account tokens would be
fragile and risky for users.

**When Bunpro publishes an official API:**
- User pastes their Bunpro API key (stored encrypted at rest, revocable from settings).
- Periodic sync of the grammar points they're studying → generate **grammar cards** (feature 1)
  and vocabulary cards from Bunpro's example sentences.
- Show "from Bunpro" as a source/tag; never write back to Bunpro unless the API supports it.

**Until then:** check whether Bunpro offers a user data export (CSV/JSON). If so, an import of
that file is a low-risk way to get most of the value.

Sources: [Bunpro community: "Bunpro API when?"](https://community.bunpro.jp/t/bunpro-api-when/100574),
[community-maintained API reference](https://github.com/cbullard-dev/bunpro-community-api).
