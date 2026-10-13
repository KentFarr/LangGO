import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AuthContext, type AuthState } from '../auth/useAuth';
import type { SessionUser } from '../lib/authClient';
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

const user = { id: 'user-1', email: 'a@example.com', name: 'A' } as SessionUser;

describe('ProtectedRoute', () => {
  it('shows a spinner while auth is loading', () => {
    renderAt({ user: null, loading: true });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('redirects signed-out users to login', () => {
    renderAt({ user: null, loading: false });
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('renders the page for signed-in users', () => {
    renderAt({ user, loading: false });
    expect(screen.getByText('secret dashboard')).toBeInTheDocument();
  });
});
