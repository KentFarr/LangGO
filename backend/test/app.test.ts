import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp, type AppDependencies } from '../src/app.js';
import type { Flashcard } from '../src/domain/flashcard.js';
import { HttpError } from '../src/errors.js';
import type { FlashcardRepository } from '../src/services/flashcardRepository.js';
import { generated } from './helpers.js';

const ORIGIN = 'http://localhost:3000';

/** Minimal in-memory repository so route behavior can be tested without a database. */
function fakeRepository() {
  const cards: Array<Flashcard & { userId: string }> = [];
  const repository: FlashcardRepository = {
    insertMany: vi.fn(async (userId: string, newCards: Parameters<FlashcardRepository['insertMany']>[1]) => {
      const created = newCards.map((c) => ({
        ...c,
        level: c.level ?? null,
        id: randomUUID(),
        reviewInterval: 1,
        nextReviewDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }));
      cards.push(...created.map((c) => ({ ...c, userId })));
      return created;
    }),
    listForUser: vi.fn(async (userId: string) => cards.filter((c) => c.userId === userId)),
    recordReview: vi.fn(
      async (userId: string, id: string) =>
        cards.find((c) => c.userId === userId && c.id === id) ?? null,
    ),
    deleteForUser: vi.fn(async (userId: string, id: string) => {
      const index = cards.findIndex((c) => c.userId === userId && c.id === id);
      if (index !== -1) cards.splice(index, 1);
      return index !== -1;
    }),
  };
  return repository;
}

function setup(overrides: Partial<AppDependencies> = {}) {
  const deps = {
    getUserId: vi.fn(async (req: { get(name: string): string | undefined }) =>
      req.get('x-test-user') ?? null,
    ),
    generator: { generate: vi.fn(async (_words: string[]) => generated) },
    repository: fakeRepository(),
    allowedOrigins: [ORIGIN],
  };
  const app = createApp({ ...deps, ...overrides });
  const as = (user: string) => ({
    get: (url: string) => request(app).get(url).set('x-test-user', user),
    post: (url: string) => request(app).post(url).set('x-test-user', user).set('Origin', ORIGIN),
    delete: (url: string) => request(app).delete(url).set('x-test-user', user).set('Origin', ORIGIN),
  });
  return { app, deps, as };
}

describe('authentication and origin checks', () => {
  it('rejects requests without a session', async () => {
    const { app } = setup();
    expect((await request(app).get('/api/flashcards')).status).toBe(401);
  });

  it('rejects writes from untrusted origins before touching the session', async () => {
    const { app, deps } = setup();
    const res = await request(app)
      .post('/api/flashcards')
      .set('Origin', 'https://evil.example')
      .set('x-test-user', 'user-1')
      .send({ words: ['勉強'] });

    expect(res.status).toBe(403);
    expect(deps.getUserId).not.toHaveBeenCalled();
  });
});

describe('POST /api/flashcards', () => {
  it.each([
    ['missing words', {}],
    ['empty list', { words: [] }],
    ['non-string entries', { words: [1, 2] }],
    ['too many words', { words: Array.from({ length: 21 }, (_, i) => `w${i}`) }],
    ['an out-of-range level', { words: ['勉強'], level: 7 }],
    ['a non-integer level', { words: ['勉強'], level: 2.5 }],
  ])('returns 400 for %s', async (_label, body) => {
    const { as, deps } = setup();
    const res = await as('user-1').post('/api/flashcards').send(body);

    expect(res.status).toBe(400);
    expect(deps.generator.generate).not.toHaveBeenCalled();
  });

  it('generates de-duplicated words and stores requested and related cards', async () => {
    const { as, deps } = setup();
    const res = await as('user-1').post('/api/flashcards').send({ words: ['勉強', '学校', '勉強'] });

    expect(res.status).toBe(201);
    expect(deps.generator.generate).toHaveBeenCalledWith(['勉強', '学校']);
    expect(res.body.flashcards.map((c: Flashcard) => [c.word, c.source])).toEqual([
      ['勉強', 'requested'],
      ['学校', 'requested'],
      ['先生', 'related'],
    ]);
  });

  it('stores the JLPT level on every generated card', async () => {
    const { as, deps } = setup();
    const res = await as('user-1').post('/api/flashcards').send({ words: ['勉強'], level: 3 });

    expect(res.status).toBe(201);
    expect(res.body.flashcards.every((c: Flashcard) => c.level === 3)).toBe(true);
    expect(deps.repository.insertMany).toHaveBeenCalledWith(
      'user-1',
      expect.arrayContaining([expect.objectContaining({ word: '先生', level: 3, source: 'related' })]),
    );
  });

  it('returns a generic 500 when generation fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { as } = setup({
      generator: { generate: vi.fn(async () => Promise.reject(new Error('secret upstream detail'))) },
    });
    const res = await as('user-1').post('/api/flashcards').send({ words: ['勉強'] });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
    consoleError.mockRestore();
  });

  it('does not leak upstream errors that carry an HTTP status', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const upstream = Object.assign(new Error('401 Incorrect API key provided: sk-secret'), {
      status: 401,
    });
    const { as } = setup({ generator: { generate: vi.fn(async () => Promise.reject(upstream)) } });
    const res = await as('user-1').post('/api/flashcards').send({ words: ['勉強'] });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
    consoleError.mockRestore();
  });

  it('rate limits generation per user', async () => {
    const { as } = setup({ generateRateLimit: 1 });
    const send = (user: string) => as(user).post('/api/flashcards').send({ words: ['勉強'] });

    expect((await send('user-1')).status).toBe(201);
    expect((await send('user-1')).status).toBe(429);
    expect((await send('user-2')).status).toBe(201);
  });
});

describe('review and delete', () => {
  it('validates the review body', async () => {
    const { as } = setup();
    const res = await as('user-1').post(`/api/flashcards/${randomUUID()}/review`).send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 for malformed ids without querying', async () => {
    const { as, deps } = setup();

    expect((await as('user-1').post('/api/flashcards/nope/review').send({ remembered: true })).status).toBe(404);
    expect((await as('user-1').delete('/api/flashcards/nope')).status).toBe(404);
    expect(deps.repository.recordReview).not.toHaveBeenCalled();
    expect(deps.repository.deleteForUser).not.toHaveBeenCalled();
  });

  it('deletes only the caller’s own cards', async () => {
    const { as } = setup();
    const created = await as('user-1').post('/api/flashcards').send({ words: ['勉強'] });
    const id = created.body.flashcards[0].id;

    expect((await as('user-2').delete(`/api/flashcards/${id}`)).status).toBe(404);
    expect((await as('user-1').delete(`/api/flashcards/${id}`)).status).toBe(204);
  });
});

describe('other routes', () => {
  it('exposes a health check', async () => {
    const res = await request(setup().app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns JSON 404 for unknown API routes', async () => {
    const res = await request(setup().app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  it('returns 400 for malformed JSON', async () => {
    const { as } = setup();
    const res = await as('user-1')
      .post('/api/flashcards')
      .set('Content-Type', 'application/json')
      .send('{not json');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/extract-url', () => {
  const page = { url: 'https://example.com/a', title: 'Example', text: '勉強します' };

  it('requires a session', async () => {
    const { app } = setup({ fetchPage: vi.fn(async () => page) });
    const res = await request(app).post('/api/extract-url').send({ url: 'https://example.com/a' });
    expect(res.status).toBe(401);
  });

  it('returns the extracted page', async () => {
    const fetchPage = vi.fn(async () => page);
    const { as } = setup({ fetchPage });
    const res = await as('user-1').post('/api/extract-url').send({ url: ' https://example.com/a ' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(page);
    expect(fetchPage).toHaveBeenCalledWith('https://example.com/a');
  });

  it('validates the body and passes safe fetch errors through', async () => {
    const { as } = setup({
      fetchPage: vi.fn(async () => {
        throw new HttpError(400, "That address can't be fetched.");
      }),
    });
    expect((await as('user-1').post('/api/extract-url').send({})).status).toBe(400);

    const blocked = await as('user-1').post('/api/extract-url').send({ url: 'http://10.0.0.1/' });
    expect(blocked.status).toBe(400);
    expect(blocked.body).toEqual({ error: "That address can't be fetched." });
  });

  it('is not mounted without a page fetcher', async () => {
    const { as } = setup();
    expect((await as('user-1').post('/api/extract-url').send({ url: 'https://example.com' })).status).toBe(404);
  });
});

describe('POST /api/flashcards/export', () => {
  async function withCards() {
    const ctx = setup();
    const created = await ctx.as('user-1').post('/api/flashcards').send({ words: ['勉強', '学校'], level: 5 });
    return { ...ctx, ids: created.body.flashcards.map((c: Flashcard) => c.id) as string[] };
  }

  it('downloads an Anki package', async () => {
    const { as } = await withCards();
    const res = await as('user-1')
      .post('/api/flashcards/export')
      .send({ format: 'apkg' })
      .buffer(true)
      .parse((r, done) => {
        const chunks: Buffer[] = [];
        r.on('data', (c: Buffer) => chunks.push(c));
        r.on('end', () => done(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="?langgo-\d{4}-\d{2}-\d{2}\.apkg"?/);
    // Zip files start with "PK".
    expect((res.body as Buffer).subarray(0, 2).toString()).toBe('PK');
  });

  it('exports only the requested cards as CSV', async () => {
    const { as, ids } = await withCards();
    const res = await as('user-1').post('/api/flashcards/export').send({ format: 'csv', ids: [ids[0]] });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    const rows = res.text.split('\r\n').filter((line) => line && !line.startsWith('#') && !line.startsWith('﻿#'));
    expect(rows).toHaveLength(1);
  });

  it('rejects bad formats, foreign ids and empty exports', async () => {
    const { as } = await withCards();
    expect((await as('user-1').post('/api/flashcards/export').send({ format: 'pdf' })).status).toBe(400);
    expect((await as('user-2').post('/api/flashcards/export').send({ format: 'csv' })).status).toBe(400);
    const foreign = await as('user-2')
      .post('/api/flashcards/export')
      .send({ format: 'csv', ids: ['11111111-1111-4111-8111-111111111111'] });
    expect(foreign.status).toBe(400);
  });
});
