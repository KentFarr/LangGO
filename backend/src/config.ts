import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/, error: 'DATABASE_URL must be a postgres:// URL' }),
  /** Signs session cookies. Generate with `openssl rand -base64 32`. */
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  /** Public URL users open in the browser (the Vite dev server in development). */
  BETTER_AUTH_URL: z.url().default('http://localhost:3000'),
  /** Extra comma-separated origins allowed to call the API with cookies. */
  TRUSTED_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  /** Leave empty to run in demo mode with built-in sample flashcards. */
  OPENAI_API_KEY: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  OPENAI_MODEL: z.string().min(1).default('gpt-4o-mini'),
  /** Number of reverse proxies in front of the app (0 when clients connect directly). */
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
  /** Max flashcard generations per user per 15 minutes (each one is a paid OpenAI call). */
  GENERATE_RATE_LIMIT: z.coerce.number().int().positive().default(20),
});

export type Config = z.infer<typeof envSchema>;

/** Validates environment variables once at startup so misconfiguration fails fast. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}

/** Every origin allowed to send cookie-authenticated requests. */
export function allowedOrigins(config: Pick<Config, 'BETTER_AUTH_URL' | 'TRUSTED_ORIGINS'>) {
  return [new URL(config.BETTER_AUTH_URL).origin, ...config.TRUSTED_ORIGINS];
}
