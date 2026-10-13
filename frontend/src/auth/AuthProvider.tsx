import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState, type ReactNode } from 'react';
import { auth } from '../lib/firebase';
import { AuthContext, type AuthState } from './useAuth';

/** Subscribes to Firebase Auth once and shares the current user with the whole app. */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(
    () => onAuthStateChanged(auth, (user) => setState({ user, loading: false })),
    [],
  );

  return <AuthContext value={state}>{children}</AuthContext>;
}
