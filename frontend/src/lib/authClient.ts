import { createAuthClient } from 'better-auth/react';

// The API is same-origin (Vite proxies /api in development), so no baseURL is needed.
export const authClient = createAuthClient({ basePath: '/api/auth' });

export type SessionUser = typeof authClient.$Infer.Session.user;
