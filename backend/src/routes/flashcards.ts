import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import type { FlashcardRepository } from '../services/flashcardRepository.js';
import type { MnemonicGenerator } from '../services/mnemonicGenerator.js';

export const MAX_WORDS_PER_REQUEST = 20;

const generateRequestSchema = z.object({
  words: z.array(z.string().trim().min(1).max(32)).min(1).max(MAX_WORDS_PER_REQUEST),
  /** JLPT level the words were picked for (5 = N5 … 1 = N1). */
  level: z.number().int().min(1).max(5).optional(),
});

const reviewRequestSchema = z.object({ remembered: z.boolean() });

const cardIdSchema = z.uuid();

function invalid(error: z.ZodError) {
  return {
    error: 'Invalid request',
    details: error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
  };
}

interface FlashcardsRouterOptions {
  generator: MnemonicGenerator;
  repository: FlashcardRepository;
  /** Applied to generation only, since that is the endpoint that costs money. */
  generateLimiter: RequestHandler;
}

export function flashcardsRouter({ generator, repository, generateLimiter }: FlashcardsRouterOptions) {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json({ flashcards: await repository.listForUser(res.locals.userId) });
  });

  router.post('/', generateLimiter, async (req, res) => {
    const parsed = generateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(invalid(parsed.error));
      return;
    }

    const { words, level } = parsed.data;
    const generated = await generator.generate([...new Set(words)]);
    const flashcards = await repository.insertMany(res.locals.userId, [
      ...generated.flashcards.map((card) => ({ ...card, level, source: 'requested' as const })),
      ...generated.relatedWords.map((card) => ({ ...card, level, source: 'related' as const })),
    ]);
    res.status(201).json({ flashcards });
  });

  router.post('/:id/review', async (req, res) => {
    const id = cardIdSchema.safeParse(req.params.id);
    const body = reviewRequestSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json(invalid(body.error));
      return;
    }

    const flashcard =
      id.success && (await repository.recordReview(res.locals.userId, id.data, body.data.remembered));
    if (!flashcard) {
      res.status(404).json({ error: 'Flashcard not found' });
      return;
    }
    res.json({ flashcard });
  });

  router.delete('/:id', async (req, res) => {
    const id = cardIdSchema.safeParse(req.params.id);
    if (!id.success || !(await repository.deleteForUser(res.locals.userId, id.data))) {
      res.status(404).json({ error: 'Flashcard not found' });
      return;
    }
    res.status(204).end();
  });

  return router;
}
