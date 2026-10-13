export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'langgo-theme';
const PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

export function getThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return PREFERENCES.includes(stored as ThemePreference) ? (stored as ThemePreference) : 'system';
  } catch {
    return 'system';
  }
}

/** Mirrors public/theme-init.js, which runs before React to avoid a flash. */
export function applyTheme(preference: ThemePreference) {
  const dark = preference === 'dark' || (preference === 'system' && darkQuery().matches);
  document.documentElement.classList.toggle('dark', dark);
}

export function setThemePreference(preference: ThemePreference) {
  try {
    if (preference === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Not persisted, but still applied for this visit.
  }
  applyTheme(preference);
}

export function nextThemePreference(current: ThemePreference): ThemePreference {
  return PREFERENCES[(PREFERENCES.indexOf(current) + 1) % PREFERENCES.length]!;
}

/** Re-applies the theme when the OS setting changes; returns an unsubscribe function. */
export function watchSystemTheme(onChange: () => void) {
  const query = darkQuery();
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
