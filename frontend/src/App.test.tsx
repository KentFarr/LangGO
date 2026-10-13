import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { AuthContext } from './auth/useAuth';

// Pages only reference the auth client in event handlers; rendering never calls it.
vi.mock('./lib/authClient', () => ({ authClient: {} }));

function renderAt(path: string) {
  render(
    <AuthContext value={{ user: null, loading: false }}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </AuthContext>,
  );
}

describe('App routes', () => {
  it.each([
    ['/', /read real japanese/i],
    ['/login', /welcome back/i],
    ['/signup', /create your account/i],
    ['/privacy', /privacy policy/i],
    ['/no-such-page', /page not found/i],
  ])('renders %s', async (path, heading) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });

  it('sends signed-out visitors from the dashboard to log in', async () => {
    renderAt('/dashboard');
    expect(await screen.findByRole('heading', { level: 1, name: /welcome back/i })).toBeInTheDocument();
  });

  it('shows sign-up and log-in links in the navbar when signed out', () => {
    renderAt('/');
    const nav = within(screen.getByRole('navigation', { name: 'Main' }));
    expect(nav.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup');
    expect(nav.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login');
  });
});
