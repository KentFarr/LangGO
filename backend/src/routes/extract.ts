import { Router } from 'express';
import { z } from 'zod';
import type { PageFetcher } from '../services/pageFetcher.js';

const requestSchema = z.object({ url: z.string().trim().min(1).max(2048) });

/** POST /api/extract-url: fetch a web page and return its readable text for word matching. */
export function extractRouter(fetchPage: PageFetcher) {
  const router = Router();

  router.post('/', async (req, res) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Please enter a web address.' });
      return;
    }
    res.json(await fetchPage(parsed.data.url));
  });

  return router;
}
