import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { THEME_STORAGE_KEY } from '../lib/theme';
import ThemeToggle from './ThemeToggle';

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

describe('ThemeToggle', () => {
  it('cycles system → light → dark → system and persists the choice', async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAccessibleName(/system theme/i);

    await userEvent.click(button);
    expect(button).toHaveAccessibleName(/^light theme/i);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement).not.toHaveClass('dark');

    await userEvent.click(button);
    expect(button).toHaveAccessibleName(/^dark theme/i);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement).toHaveClass('dark');

    await userEvent.click(button);
    expect(button).toHaveAccessibleName(/^system theme/i);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    // The test environment reports a light system preference.
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('starts from the saved preference', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toHaveAccessibleName(/^dark theme/i);
  });
});
