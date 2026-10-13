import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import type { Flashcard } from '../src/domain/flashcard.js';
import { buildApkg, buildCsv, tagsFor } from '../src/services/ankiExport.js';

// Full import into real Anki was verified manually with Anki's own importer; these tests pin
// the package structure so regressions are caught in CI.

const card = (id: string, overrides: Partial<Flashcard> = {}): Flashcard => ({
  id,
  word: '勉強',
  reading: 'べんきょう',
  meaning: 'study',
  mnemonic: 'BEN in KYOTO <studies> & "learns"',
  source: 'requested',
  level: 5,
  reviewInterval: 4,
  nextReviewDate: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const cards = [
  card('11111111-1111-4111-8111-111111111111'),
  card('22222222-2222-4222-8222-222222222222', { word: '環境', level: 3, source: 'related' }),
  card('33333333-3333-4333-8333-333333333333', { word: 'ラーメン', level: null }),
];

function openCollection(apkg: Uint8Array) {
  const files = unzipSync(apkg);
  const dir = mkdtempSync(path.join(tmpdir(), 'apkg-test-'));
  writeFileSync(path.join(dir, 'c.anki2'), files['collection.anki2']!);
  const db = new DatabaseSync(path.join(dir, 'c.anki2'));
  return { files, db, cleanup: () => (db.close(), rmSync(dir, { recursive: true, force: true })) };
}

describe('buildApkg', () => {
  it('produces a collection with one note and one new card per flashcard', () => {
    const { files, db, cleanup } = openCollection(buildApkg(cards));
    try {
      expect(strFromU8(files.media!)).toBe('{}');

      const notes = db.prepare('SELECT guid, flds, sfld, tags FROM notes ORDER BY sfld').all() as Record<string, string>[];
      expect(notes.map((n) => n.sfld)).toEqual(['ラーメン', '勉強', '環境']);
      const study = notes.find((n) => n.sfld === '勉強')!;
      expect(study.guid).toBe('langgo-11111111-1111-4111-8111-111111111111');
      expect(study.flds!.split('\x1f')).toEqual([
        '勉強',
        'べんきょう',
        'study',
        'BEN in KYOTO &lt;studies&gt; &amp; &quot;learns&quot;',
        'JLPT N5',
      ]);
      expect(study.tags).toBe(' LangGo JLPT_N5 ');

      const cardRows = db.prepare('SELECT type, queue, ivl, due FROM cards ORDER BY due').all();
      expect(cardRows).toEqual([
        { type: 0, queue: 0, ivl: 0, due: 1 },
        { type: 0, queue: 0, ivl: 0, due: 2 },
        { type: 0, queue: 0, ivl: 0, due: 3 },
      ]);
    } finally {
      cleanup();
    }
  });

  it('declares the note type and one subdeck per level', () => {
    const { db, cleanup } = openCollection(buildApkg(cards));
    try {
      const col = db.prepare('SELECT ver, models, decks FROM col').get() as Record<string, string | number>;
      expect(col.ver).toBe(11);
      const model = Object.values(JSON.parse(col.models as string))[0] as { name: string; flds: { name: string }[] };
      expect(model.name).toBe('LangGo Vocabulary');
      expect(model.flds.map((f) => f.name)).toEqual(['Word', 'Reading', 'Meaning', 'Mnemonic', 'Level']);
      const deckNames = Object.values(JSON.parse(col.decks as string)).map((d) => (d as { name: string }).name);
      expect(deckNames.sort()).toEqual(['Default', 'LangGo', 'LangGo::N3', 'LangGo::N5', 'LangGo::Other']);
    } finally {
      cleanup();
    }
  });

  it('uses stable ids so re-exports update notes instead of duplicating them', () => {
    const ids = (apkg: Uint8Array) => {
      const { db, cleanup } = openCollection(apkg);
      const rows = db.prepare('SELECT id, guid FROM notes ORDER BY id').all();
      cleanup();
      return rows;
    };
    expect(ids(buildApkg(cards))).toEqual(ids(buildApkg(cards, new Date('2030-01-01'))));
  });
});

describe('buildCsv', () => {
  it('writes Anki headers and escapes values', () => {
    const csv = buildCsv(cards);
    const lines = csv.trimEnd().split('\r\n');
    expect(lines.slice(0, 6)).toEqual([
      '#separator:Comma',
      '#html:true',
      '#notetype:Basic',
      '#deck:LangGo',
      '#columns:Front,Back,Tags',
      '#tags column:3',
    ]);
    expect(lines[6]).toBe(
      // HTML-escaped, so no raw quotes or commas remain and the cell needs no CSV quoting.
      '勉強,べんきょう<br>study<br><br>BEN in KYOTO &lt;studies&gt; &amp; &quot;learns&quot;,LangGo JLPT_N5',
    );
    expect(lines[7]).toMatch(/^環境,.*,LangGo JLPT_N3 related$/);
  });
});

describe('tagsFor', () => {
  it('quotes cells that contain commas', () => {
    expect(buildCsv([card('44444444-4444-4444-8444-444444444444', { mnemonic: 'one, two' })])).toContain(
      '"べんきょう<br>study<br><br>one, two"',
    );
  });

  it('tags level and related words', () => {
    expect(tagsFor(cards[1]!)).toEqual(['LangGo', 'JLPT_N3', 'related']);
    expect(tagsFor(cards[2]!)).toEqual(['LangGo']);
  });
});
