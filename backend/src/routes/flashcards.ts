import { Router } from 'express';
import { z } from 'zod';
import { createFlashcard } from '../domain/flashcard.js';
import type { FlashcardRepository } from '../services/flashcardRepository.js';
import type { MnemonicGenerator } from '../services/mnemonicGenerator.js';

export const MAX_WORDS_PER_REQUEST = 20;

const generateRequestSchema = z.object({
  words: z.array(z.string().trim().min(1).max(32)).min(1).max(MAX_WORDS_PER_REQUEST),
});

export function flashcardsRouter(generator: MnemonicGenerator, repository: FlashcardRepository) {
  const router = Router();

  router.post('/', async (req, res) => {
    const parsed = generateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
      });
      return;
    }

    const words = [...new Set(parsed.data.words)];
    const generated = await generator.generate(words);

    const now = new Date();
    const batch = {
      flashcards: generated.flashcards.map((card) => createFlashcard(card, now)),
      relatedWords: generated.relatedWords.map((card) => createFlashcard(card, now)),
    };
    const docId = await repository.saveBatch(res.locals.uid, batch);

    res.status(201).json({ docId, ...batch });
  });

  return router;
}
