import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { createAuth } from '../src/auth.js';
import type { Flashcard } from '../src/domain/flashcard.js';
import { createFlashcardRepository } from '../src/services/flashcardRepository.js';
import { createTestDatabase, generated } from './helpers.js';

// Exercises real Better Auth sessions, real SQL migrations, and the Drizzle repository
// against in-process Postgres (PGlite). Only the OpenAI call is faked.

const ORIGIN = 'http://localhost:3000';

let database: Awaited<ReturnType<typeof createTestDatabase>>;
let app: ReturnType<typeof createApp>;

function buildApp({ rateLimit, trustProxyHops = 0 }: { rateLimit: boolean; trustProxyHops?: number }) {
  const auth = createAuth(database.db, {
    secret: 'test-secret-that-is-at-least-32-characters-long',
    baseURL: ORIGIN,
    trustedOrigins: [ORIGIN],
    rateLimit,
  });
  return createApp({
    getUserId: async (req) =>
      (await auth.api.getSession({ headers: fromNodeHeaders(req.headers) }))?.user.id ?? null,
    authHandler: toNodeHandler(auth),
    generator: { generate: vi.fn(async () => generated) },
    repository: createFlashcardRepository(database.db),
    allowedOrigins: [ORIGIN],
    trustProxyHops,
  });
}

beforeAll(async () => {
  database = await createTestDatabase();
  // The flow tests sign up many users from one IP; rate limiting has its own test below.
  app = buildApp({ rateLimit: false });
});

afterAll(async () => {
  await database.close();
});

/** Signs up a new user and returns a cookie-carrying client for them. */
async function signUp(email: string) {
  const agent = request.agent(app);
  const res = await agent
    .post('/api/auth/sign-up/email')
    .set('Origin', ORIGIN)
    .send({ email, password: 'correct horse battery', name: email.split('@')[0] });
  expect(res.status).toBe(200);
  return {
    get: (url: string) => agent.get(url),
    post: (url: string) => agent.post(url).set('Origin', ORIGIN),
    delete: (url: string) => agent.delete(url).set('Origin', ORIGIN),
  };
}

describe('flashcards with real auth and Postgres', () => {
  it('runs the full create → list → review → delete flow', async () => {
    const alice = await signUp('alice@example.com');

    const created = await alice.post('/api/flashcards').send({ words: ['勉強', '学校'] });
    expect(created.status).toBe(201);
    expect(created.body.flashcards).toHaveLength(3);

    const listed = await alice.get('/api/flashcards');
    expect(listed.status).toBe(200);
    expect(listed.body.flashcards.map((c: Flashcard) => c.word).sort()).toEqual(['先生', '勉強', '学校']);

    const target: Flashcard = listed.body.flashcards[0];
    expect(target.reviewInterval).toBe(1);

    const reviewed = await alice.post(`/api/flashcards/${target.id}/review`).send({ remembered: true });
    expect(reviewed.status).toBe(200);
    expect(reviewed.body.flashcard.reviewInterval).toBe(2);
    expect(new Date(reviewed.body.flashcard.nextReviewDate).getTime()).toBeGreaterThan(
      new Date(target.nextReviewDate).getTime(),
    );

    const forgot = await alice.post(`/api/flashcards/${target.id}/review`).send({ remembered: false });
    expect(forgot.body.flashcard.reviewInterval).toBe(1);

    expect((await alice.delete(`/api/flashcards/${target.id}`)).status).toBe(204);
    expect((await alice.get('/api/flashcards')).body.flashcards).toHaveLength(2);
  });

  it('isolates users from each other', async () => {
    const bob = await signUp('bob@example.com');
    const mallory = await signUp('mallory@example.com');

    const [card] = (await bob.post('/api/flashcards').send({ words: ['勉強'] })).body.flashcards;

    expect((await mallory.get('/api/flashcards')).body.flashcards).toEqual([]);
    expect(
      (await mallory.post(`/api/flashcards/${card.id}/review`).send({ remembered: true })).status,
    ).toBe(404);
    expect((await mallory.delete(`/api/flashcards/${card.id}`)).status).toBe(404);
    expect((await bob.get('/api/flashcards')).body.flashcards).toHaveLength(3);
  });

  it('rejects anonymous requests and wrong passwords', async () => {
    expect((await request(app).get('/api/flashcards')).status).toBe(401);

    await signUp('carol@example.com');
    const res = await request(app)
      .post('/api/auth/sign-in/email')
      .set('Origin', ORIGIN)
      .send({ email: 'carol@example.com', password: 'wrong password!' });
    expect(res.status).toBe(401);
  });

  it('ends the session on sign-out', async () => {
    const agent = request.agent(app);
    await agent
      .post('/api/auth/sign-up/email')
      .set('Origin', ORIGIN)
      .send({ email: 'dave@example.com', password: 'correct horse battery', name: 'dave' });
    expect((await agent.get('/api/flashcards')).status).toBe(200);

    await agent.post('/api/auth/sign-out').set('Origin', ORIGIN).send({});
    expect((await agent.get('/api/flashcards')).status).toBe(401);
  });

  it('rate limits repeated sign-in attempts', async () => {
    const limited = buildApp({ rateLimit: true });
    const attempt = () =>
      request(limited)
        .post('/api/auth/sign-in/email')
        .set('Origin', ORIGIN)
        .send({ email: 'nobody@example.com', password: 'guess-guess' });

    const statuses = [];
    for (let i = 0; i < 6; i++) statuses.push((await attempt()).status);
    expect(statuses).toContain(429);

    // A client can't dodge the limit by spoofing the internal IP header.
    const spoofed = await attempt().set('x-langgo-client-ip', '203.0.113.7');
    expect(spoofed.status).toBe(429);
  });

  it('keeps sign-in rate limits separate per client behind a trusted proxy', async () => {
    const limited = buildApp({ rateLimit: true, trustProxyHops: 1 });
    const attemptFrom = (ip: string) =>
      request(limited)
        .post('/api/auth/sign-in/email')
        .set('Origin', ORIGIN)
        .set('X-Forwarded-For', ip)
        .send({ email: 'nobody@example.com', password: 'guess-guess' });

    for (let i = 0; i < 6; i++) await attemptFrom('198.51.100.1');
    expect((await attemptFrom('198.51.100.1')).status).toBe(429);
    expect((await attemptFrom('198.51.100.2')).status).toBe(401);
  });
});
