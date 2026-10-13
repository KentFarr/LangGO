import OpenAI from 'openai';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { HttpError } from '../src/errors.js';
import {
  createDemoMnemonicGenerator,
  SAMPLE_CARDS,
  SAMPLE_WORDS_BY_LEVEL,
} from '../src/services/demoGenerator.js';
import { createOpenAIMnemonicGenerator, RELATED_WORD_COUNT } from '../src/services/mnemonicGenerator.js';

describe('demo generator', () => {
  const generator = createDemoMnemonicGenerator();

  it('returns complete sample cards for known words, in request order', async () => {
    const { flashcards } = await generator.generate(['先生', '学校']);
    expect(flashcards.map((c) => c.word)).toEqual(['先生', '学校']);
    expect(flashcards[0]).toMatchObject({ reading: 'せんせい', meaning: 'teacher' });
  });

  it('suggests related sample words from the same level, excluding requested ones', async () => {
    const { relatedWords } = await generator.generate(['把握']);
    expect(relatedWords).toHaveLength(RELATED_WORD_COUNT);
    for (const related of relatedWords) {
      expect(SAMPLE_WORDS_BY_LEVEL[1]).toContain(related.word);
      expect(related.word).not.toBe('把握');
    }
  });

  it('returns a clearly labeled placeholder for words without a sample card', async () => {
    const { flashcards } = await generator.generate(['猫']);
    expect(flashcards[0]).toMatchObject({ word: '猫', reading: '', meaning: 'Sample card' });
    expect(flashcards[0]!.mnemonic).toMatch(/demo mode/i);
  });

  it('has readings in hiragana and a mnemonic that mentions the reading', () => {
    for (const card of Object.values(SAMPLE_CARDS).flat()) {
      expect(card.reading).toMatch(/^[ぁ-ゟ]+$/);
      expect(card.mnemonic).toContain(card.reading);
    }
  });
});

describe('OpenAI generator errors', () => {
  it('turns API failures into a user-safe 503 with a one-line log', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const apiError = new OpenAI.APIError(
      429,
      { code: 'insufficient_quota' },
      'You have no credits remaining',
      new Headers({ 'x-request-id': 'req_123' }),
    );
    const client = { responses: { parse: vi.fn().mockRejectedValue(apiError) } } as unknown as OpenAI;

    const error = await createOpenAIMnemonicGenerator(client, 'gpt-4o-mini')
      .generate(['勉強'])
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ status: 503 });
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0]![0]).toMatch(/status=429.*request_id=req_123/);
    consoleError.mockRestore();
  });

  it('returns the safe message to the client through the API', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = createApp({
      getUserId: async () => 'user-1',
      generator: {
        generate: async () => {
          throw new HttpError(503, 'Flashcard generation is temporarily unavailable.');
        },
      },
      repository: {} as never,
      allowedOrigins: [],
    });

    const res = await request(app).post('/api/flashcards').send({ words: ['勉強'] });
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: 'Flashcard generation is temporarily unavailable.' });
    consoleError.mockRestore();
  });
});

describe('GET /api/meta', () => {
  const base = {
    getUserId: async () => null,
    generator: createDemoMnemonicGenerator(),
    repository: {} as never,
    allowedOrigins: [],
  };

  it('reports demo mode and the sample words', async () => {
    const res = await request(createApp({ ...base, demoSampleWords: SAMPLE_WORDS_BY_LEVEL })).get('/api/meta');
    expect(res.body.demoMode).toBe(true);
    expect(res.body.sampleWords['5']).toContain('学校');
  });

  it('reports normal mode', async () => {
    const res = await request(createApp(base)).get('/api/meta');
    expect(res.body).toEqual({ demoMode: false, sampleWords: null });
  });
});
