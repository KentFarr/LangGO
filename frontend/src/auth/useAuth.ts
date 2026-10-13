import { createContext, useContext } from 'react';
import type { SessionUser } from '../lib/authClient';

export interface AuthState {
  user: SessionUser | null;
  /** True until the current session has been fetched from the server. */
  loading: boolean;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const state = useContext(AuthContext);
  if (!state) throw new Error('useAuth must be used inside <AuthProvider>');
  return state;
}

/** For pages behind `ProtectedRoute`, where a signed-in user is guaranteed. */
export function useRequiredUser(): SessionUser {
  const { user } = useAuth();
  if (!user) throw new Error('useRequiredUser must be used inside <ProtectedRoute>');
  return user;
}
