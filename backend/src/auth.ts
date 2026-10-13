import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { Database } from './db/client.js';
import * as schema from './db/schema.js';

/** Set by the app from Express's `req.ip`; any client-supplied value is overwritten. */
export const CLIENT_IP_HEADER = 'x-langgo-client-ip';

export interface AuthOptions {
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
  /** Brute-force protection on sign-in/sign-up; only disabled in tests. */
  rateLimit?: boolean;
}

export function createAuth(db: Database, { secret, baseURL, trustedOrigins, rateLimit = true }: AuthOptions) {
  return betterAuth({
    secret,
    baseURL,
    basePath: '/api/auth',
    trustedOrigins,
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    rateLimit: { enabled: rateLimit },
    advanced: { ipAddress: { ipAddressHeaders: [CLIENT_IP_HEADER] } },
  });
}

export type Auth = ReturnType<typeof createAuth>;
