import { render, screen } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AuthContext, type AuthState } from '../auth/useAuth';
import ProtectedRoute from './ProtectedRoute';

function renderAt(auth: AuthState) {
  render(
    <AuthContext value={auth}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <p>secret dashboard</p>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<p>login page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext>,
  );
}

const userWith = (emailVerified: boolean) => ({ emailVerified }) as User;

describe('ProtectedRoute', () => {
  it('shows a spinner while auth is loading', () => {
    renderAt({ user: null, loading: true });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('redirects signed-out users to login', () => {
    renderAt({ user: null, loading: false });
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('redirects users whose email is not verified', () => {
    renderAt({ user: userWith(false), loading: false });
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('renders the page for verified users', () => {
    renderAt({ user: userWith(true), loading: false });
    expect(screen.getByText('secret dashboard')).toBeInTheDocument();
  });
});
