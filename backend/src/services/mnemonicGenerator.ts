import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { HttpError } from '../errors.js';

export const RELATED_WORD_COUNT = 5;

const cardSchema = z.object({
  word: z.string().describe('The Japanese word exactly as written, including kanji.'),
  reading: z.string().describe('The reading of the word in hiragana.'),
  meaning: z.string().describe('A concise English meaning.'),
  mnemonic: z
    .string()
    .describe('A short, vivid English mnemonic linking the sound of the reading to the meaning.'),
});

export const generationSchema = z.object({
  flashcards: z.array(cardSchema),
  relatedWords: z.array(cardSchema),
});

export type GenerationResult = z.infer<typeof generationSchema>;

export interface MnemonicGenerator {
  generate(words: string[]): Promise<GenerationResult>;
}

const INSTRUCTIONS = `You are a Japanese vocabulary tutor who writes memorable mnemonics for English-speaking learners.
For every card, give the word, its hiragana reading, its English meaning, and a mnemonic.
Mnemonics must be easy to remember and must mention both the hiragana reading and the English meaning.`;

export function buildPrompt(words: string[]): string {
  return [
    `Create one flashcard for each of these ${words.length} words, in the same order: ${words.join('、')}.`,
    `Then suggest ${RELATED_WORD_COUNT} additional related words of similar JLPT difficulty`,
    `that are not in the list above, and return them as "relatedWords".`,
  ].join('\n');
}

export function createOpenAIMnemonicGenerator(client: OpenAI, model: string): MnemonicGenerator {
  return {
    async generate(words) {
      let response;
      try {
        response = await client.responses.parse({
          model,
          instructions: INSTRUCTIONS,
          input: buildPrompt(words),
          text: { format: zodTextFormat(generationSchema, 'flashcards') },
        });
      } catch (error) {
        // Bad key, exhausted credits, outages, etc.: log the essentials (not the full response
        // dump) and give the user a message they can act on.
        if (error instanceof OpenAI.APIError) {
          console.error(
            `OpenAI request failed: status=${error.status} code=${error.code} ` +
              `request_id=${error.requestID} message=${error.message}`,
          );
          throw new HttpError(503, 'Flashcard generation is temporarily unavailable. Please try again later.');
        }
        throw error;
      }

      if (!response.output_parsed) {
        throw new Error('OpenAI response did not contain structured output');
      }
      return response.output_parsed;
    },
  };
}
