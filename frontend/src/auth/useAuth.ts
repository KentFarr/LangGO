import type { User } from 'firebase/auth';
import { createContext, useContext } from 'react';

export interface AuthState {
  user: User | null;
  /** True until Firebase has restored (or ruled out) a persisted session. */
  loading: boolean;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const state = useContext(AuthContext);
  if (!state) throw new Error('useAuth must be used inside <AuthProvider>');
  return state;
}

/** For pages behind `ProtectedRoute`, where a signed-in user is guaranteed. */
export function useRequiredUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error('useRequiredUser must be used inside <ProtectedRoute>');
  return user;
}
