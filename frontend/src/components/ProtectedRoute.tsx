import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../auth/useAuth';
import LoadingSpinner from './LoadingSpinner';

/** Renders its children only for signed-in users with a verified email. */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
  if (!user?.emailVerified) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
