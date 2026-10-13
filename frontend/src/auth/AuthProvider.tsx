import { useMemo, type ReactNode } from 'react';
import { authClient } from '../lib/authClient';
import { AuthContext, type AuthState } from './useAuth';

/** Shares the session with the whole app; Better Auth refreshes it after sign-in/out. */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isPending } = authClient.useSession();

  const state = useMemo<AuthState>(
    () => ({ user: data?.user ?? null, loading: isPending }),
    [data, isPending],
  );

  return <AuthContext value={state}>{children}</AuthContext>;
}
