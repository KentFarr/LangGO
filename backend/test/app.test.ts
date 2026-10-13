import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp, type AppDependencies } from '../src/app.js';
import type { GenerationResult } from '../src/services/mnemonicGenerator.js';

const card = (word: string) => ({ word, reading: 'よみ', meaning: 'meaning', mnemonic: 'mnemonic' });

const generated: GenerationResult = {
  flashcards: [card('勉強'), card('学校')],
  relatedWords: [card('先生')],
};

function setup(overrides: Partial<AppDependencies> = {}) {
  const deps = {
    verifyIdToken: vi.fn(async (token: string) => {
      if (token !== 'valid-token') throw new Error('bad token');
      return { uid: 'user-1' };
    }),
    generator: { generate: vi.fn(async (_words: string[]) => generated) },
    repository: { saveBatch: vi.fn(async (_uid: string, _batch: unknown) => 'doc-1') },
  };
  return { app: createApp({ ...deps, ...overrides }), deps };
}

describe('POST /api/flashcards', () => {
  it('rejects requests without a bearer token', async () => {
    const { app, deps } = setup();
    const res = await request(app).post('/api/flashcards').send({ words: ['勉強'] });

    expect(res.status).toBe(401);
    expect(deps.generator.generate).not.toHaveBeenCalled();
  });

  it('rejects an invalid token', async () => {
    const { app } = setup();
    const res = await request(app)
      .post('/api/flashcards')
      .set('Authorization', 'Bearer nope')
      .send({ words: ['勉強'] });

    expect(res.status).toBe(401);
  });

  it.each([
    ['missing words', {}],
    ['empty list', { words: [] }],
    ['non-string entries', { words: [1, 2] }],
    ['too many words', { words: Array.from({ length: 21 }, (_, i) => `w${i}`) }],
  ])('returns 400 for %s', async (_label, body) => {
    const { app, deps } = setup();
    const res = await request(app)
      .post('/api/flashcards')
      .set('Authorization', 'Bearer valid-token')
      .send(body);

    expect(res.status).toBe(400);
    expect(deps.generator.generate).not.toHaveBeenCalled();
  });

  it('generates, schedules, and stores a batch for the caller', async () => {
    const { app, deps } = setup();
    const res = await request(app)
      .post('/api/flashcards')
      .set('Authorization', 'Bearer valid-token')
      .send({ words: ['勉強', '学校', '勉強'] });

    expect(res.status).toBe(201);
    expect(deps.generator.generate).toHaveBeenCalledWith(['勉強', '学校']);
    expect(res.body.docId).toBe('doc-1');
    expect(res.body.flashcards).toHaveLength(2);
    expect(res.body.relatedWords).toHaveLength(1);

    for (const saved of [...res.body.flashcards, ...res.body.relatedWords]) {
      expect(saved.id).toEqual(expect.any(String));
      expect(saved.reviewInterval).toBe(1);
      expect(new Date(saved.nextReviewDate).getTime()).toBeGreaterThan(Date.now());
    }

    expect(deps.repository.saveBatch).toHaveBeenCalledWith('user-1', {
      flashcards: res.body.flashcards,
      relatedWords: res.body.relatedWords,
    });
  });

  it('returns a generic 500 when generation fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { app } = setup({
      generator: { generate: vi.fn(async () => Promise.reject(new Error('secret upstream detail'))) },
    });
    const res = await request(app)
      .post('/api/flashcards')
      .set('Authorization', 'Bearer valid-token')
      .send({ words: ['勉強'] });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
    consoleError.mockRestore();
  });

  it('rate limits per user', async () => {
    const { app } = setup({ generateRateLimit: 1 });
    const send = () =>
      request(app)
        .post('/api/flashcards')
        .set('Authorization', 'Bearer valid-token')
        .send({ words: ['勉強'] });

    expect((await send()).status).toBe(201);
    expect((await send()).status).toBe(429);
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
    const res = await request(setup().app)
      .post('/api/flashcards')
      .set('Authorization', 'Bearer valid-token')
      .set('Content-Type', 'application/json')
      .send('{not json');
    expect(res.status).toBe(400);
  });
});
