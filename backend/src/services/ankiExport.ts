import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { strToU8, zipSync } from 'fflate';
import type { Flashcard } from '../domain/flashcard.js';

/**
 * Builds Anki packages (.apkg: a zip of a SQLite "collection.anki2" plus a media manifest)
 * and Anki-ready CSV. Note ids/guids are derived from LangGo card ids, so importing a newer
 * export updates existing notes instead of duplicating them. Cards are exported as new cards:
 * Anki schedules them with its own algorithm.
 */

// Fixed ids so every export shares one note type and one deck tree in the user's collection.
const MODEL_ID = 1_712_000_000_001;
const ROOT_DECK_ID = 1_712_000_000_100;
const deckIdFor = (level: number | null) => ROOT_DECK_ID + (level ?? 9);
const deckNameFor = (level: number | null) => (level ? `LangGo::N${level}` : 'LangGo::Other');

const FIELDS = ['Word', 'Reading', 'Meaning', 'Mnemonic', 'Level'] as const;

const CSS = `.card { font-family: "Hiragino Sans", "Noto Sans JP", "Yu Gothic", sans-serif; font-size: 22px;
  text-align: center; color: #1a1a1a; background: #f1f0e9; }
.word { font-size: 56px; font-weight: 300; margin: 24px 0; }
.reading { font-size: 26px; color: #3d3b3b; }
.meaning { font-size: 24px; font-weight: 600; margin: 8px 0; }
.mnemonic { font-size: 18px; color: #3d3b3b; max-width: 32em; margin: 12px auto; }
.level { font-size: 12px; letter-spacing: .14em; color: #5f5d58; }
.nightMode.card, .night_mode .card { color: #f1f0e9; background: #141414; }`;

const FRONT = '<div class="level">{{Level}}</div><div class="word">{{Word}}</div>';
const BACK =
  '{{FrontSide}}<hr id="answer"><div class="reading">{{Reading}}</div>' +
  '<div class="meaning">{{Meaning}}</div><div class="mnemonic">{{Mnemonic}}</div>';

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Anki's duplicate-check checksum: first 8 hex digits of the SHA-1 of the first field. */
const fieldChecksum = (text: string) => parseInt(createHash('sha1').update(text).digest('hex').slice(0, 8), 16);

/** Stable numeric id per LangGo card (Anki ids are 64-bit integers; stay within JS safe range). */
const stableId = (uuid: string, salt: string) =>
  1_000_000_000_000 + (parseInt(createHash('sha1').update(salt + uuid).digest('hex').slice(0, 12), 16) % 8_000_000_000_000);

function collectionJson(cards: readonly Flashcard[], nowSeconds: number) {
  const levels = [...new Set(cards.map((c) => c.level ?? null))];
  const deck = (id: number, name: string) => ({
    id,
    name,
    desc: name === 'LangGo' ? 'Japanese vocabulary from LangGo (langgo.co).' : '',
    mod: nowSeconds,
    usn: -1,
    collapsed: false,
    browserCollapsed: false,
    newToday: [0, 0],
    revToday: [0, 0],
    lrnToday: [0, 0],
    timeToday: [0, 0],
    dyn: 0,
    conf: 1,
    extendNew: 10,
    extendRev: 50,
  });

  const decks: Record<string, ReturnType<typeof deck>> = {
    1: deck(1, 'Default'),
    [ROOT_DECK_ID]: deck(ROOT_DECK_ID, 'LangGo'),
  };
  for (const level of levels) decks[deckIdFor(level)] = deck(deckIdFor(level), deckNameFor(level));

  const models = {
    [MODEL_ID]: {
      id: MODEL_ID,
      name: 'LangGo Vocabulary',
      type: 0,
      mod: nowSeconds,
      usn: -1,
      sortf: 0,
      did: ROOT_DECK_ID,
      tmpls: [{ name: 'Recognition', ord: 0, qfmt: FRONT, afmt: BACK, did: null, bqfmt: '', bafmt: '' }],
      flds: FIELDS.map((name, ord) => ({ name, ord, sticky: false, rtl: false, font: 'Arial', size: 20, media: [] })),
      css: CSS,
      latexPre:
        '\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n' +
        '\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n',
      latexPost: '\\end{document}',
      latexsvg: false,
      req: [[0, 'any', [0]]],
      tags: [],
      vers: [],
    },
  };

  const dconf = {
    1: {
      id: 1,
      name: 'Default',
      mod: 0,
      usn: 0,
      maxTaken: 60,
      autoplay: true,
      timer: 0,
      replayq: true,
      dyn: false,
      new: { delays: [1, 10], ints: [1, 4, 0], initialFactor: 2500, order: 1, perDay: 20, bury: false },
      lapse: { delays: [10], mult: 0, minInt: 1, leechFails: 8, leechAction: 1 },
      rev: { perDay: 200, ease4: 1.3, ivlFct: 1, maxIvl: 36500, bury: false, hardFactor: 1.2 },
    },
  };

  const conf = {
    activeDecks: [1],
    curDeck: 1,
    newSpread: 0,
    collapseTime: 1200,
    timeLim: 0,
    estTimes: true,
    dueCounts: true,
    curModel: MODEL_ID,
    nextPos: cards.length + 1,
    sortType: 'noteFld',
    sortBackwards: false,
    addToCur: true,
  };

  return { conf, models, decks, dconf };
}

const SCHEMA = `
CREATE TABLE col (id integer primary key, crt integer not null, mod integer not null, scm integer not null,
  ver integer not null, dty integer not null, usn integer not null, ls integer not null, conf text not null,
  models text not null, decks text not null, dconf text not null, tags text not null);
CREATE TABLE notes (id integer primary key, guid text not null, mid integer not null, mod integer not null,
  usn integer not null, tags text not null, flds text not null, sfld integer not null, csum integer not null,
  flags integer not null, data text not null);
CREATE TABLE cards (id integer primary key, nid integer not null, did integer not null, ord integer not null,
  mod integer not null, usn integer not null, type integer not null, queue integer not null, due integer not null,
  ivl integer not null, factor integer not null, reps integer not null, lapses integer not null, left integer not null,
  odue integer not null, odid integer not null, flags integer not null, data text not null);
CREATE TABLE revlog (id integer primary key, cid integer not null, usn integer not null, ease integer not null,
  ivl integer not null, lastIvl integer not null, factor integer not null, time integer not null, type integer not null);
CREATE TABLE graves (usn integer not null, oid integer not null, type integer not null);
CREATE INDEX ix_notes_usn ON notes (usn);
CREATE INDEX ix_cards_usn ON cards (usn);
CREATE INDEX ix_revlog_usn ON revlog (usn);
CREATE INDEX ix_cards_nid ON cards (nid);
CREATE INDEX ix_cards_sched ON cards (did, queue, due);
CREATE INDEX ix_revlog_cid ON revlog (cid);
CREATE INDEX ix_notes_csum ON notes (csum);
`;

export function tagsFor(card: Flashcard): string[] {
  return ['LangGo', card.level ? `JLPT_N${card.level}` : null, card.source === 'related' ? 'related' : null].filter(
    (tag): tag is string => Boolean(tag),
  );
}

function fieldsFor(card: Flashcard): string[] {
  return [card.word, card.reading, card.meaning, card.mnemonic, card.level ? `JLPT N${card.level}` : ''].map(escapeHtml);
}

export function buildApkg(cards: readonly Flashcard[], now = new Date()): Uint8Array {
  const dir = mkdtempSync(path.join(tmpdir(), 'langgo-apkg-'));
  const file = path.join(dir, 'collection.anki2');
  try {
    const db = new DatabaseSync(file);
    db.exec(SCHEMA);

    const nowMs = now.getTime();
    const nowSeconds = Math.floor(nowMs / 1000);
    const { conf, models, decks, dconf } = collectionJson(cards, nowSeconds);
    db.prepare('INSERT INTO col VALUES (1, ?, ?, ?, 11, 0, 0, 0, ?, ?, ?, ?, ?)').run(
      Math.floor(nowSeconds / 86_400) * 86_400,
      nowMs,
      nowMs,
      JSON.stringify(conf),
      JSON.stringify(models),
      JSON.stringify(decks),
      JSON.stringify(dconf),
      '{}',
    );

    const insertNote = db.prepare('INSERT INTO notes VALUES (?, ?, ?, ?, -1, ?, ?, ?, ?, 0, \'\')');
    const insertCard = db.prepare(
      "INSERT INTO cards VALUES (?, ?, ?, 0, ?, -1, 0, 0, ?, 0, 0, 0, 0, 0, 0, 0, 0, '')",
    );

    db.exec('BEGIN');
    cards.forEach((card, index) => {
      const noteId = stableId(card.id, 'note:');
      const fields = fieldsFor(card);
      insertNote.run(
        noteId,
        `langgo-${card.id}`,
        MODEL_ID,
        nowSeconds,
        ` ${tagsFor(card).join(' ')} `,
        fields.join('\x1f'),
        card.word,
        fieldChecksum(card.word),
      );
      insertCard.run(stableId(card.id, 'card:'), noteId, deckIdFor(card.level), nowSeconds, index + 1);
    });
    db.exec('COMMIT');
    db.close();

    return zipSync({ 'collection.anki2': readFileSync(file), media: strToU8('{}') });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const csvCell = (value: string) => (/[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

/**
 * CSV for Anki's built-in "Basic" note type (Front/Back), with Anki's import headers so it
 * picks the note type, deck and tags automatically (Anki 2.1.55+). Use the .apkg for the
 * full LangGo note type with separate fields.
 */
export function buildCsv(cards: readonly Flashcard[]): string {
  const header = [
    '#separator:Comma',
    '#html:true',
    '#notetype:Basic',
    '#deck:LangGo',
    '#columns:Front,Back,Tags',
    '#tags column:3',
  ];
  const rows = cards.map((card) => {
    const back = [card.reading, card.meaning].filter(Boolean).map(escapeHtml);
    // A blank line before the mnemonic.
    if (card.mnemonic) back.push(`<br>${escapeHtml(card.mnemonic)}`);
    return [escapeHtml(card.word), back.join('<br>'), tagsFor(card).join(' ')].map(csvCell).join(',');
  });
  return [...header, ...rows].join('\r\n') + '\r\n';
}
