// Entry point for the Better Auth CLI, used only to (re)generate src/db/auth-schema.ts:
//   npm run auth:generate
// It mirrors the options in src/auth.ts that affect the schema; the database is never queried.
import { PGlite } from '@electric-sql/pglite';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/pglite';

export const auth = betterAuth({
  database: drizzleAdapter(drizzle(new PGlite()), { provider: 'pg' }),
  emailAndPassword: { enabled: true },
});
