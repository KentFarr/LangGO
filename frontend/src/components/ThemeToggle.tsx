import clsx from 'clsx';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  applyTheme,
  getThemePreference,
  nextThemePreference,
  setThemePreference,
  watchSystemTheme,
  type ThemePreference,
} from '../lib/theme';

const icons = { system: Monitor, light: Sun, dark: Moon } as const;
const labels = { system: 'System theme', light: 'Light theme', dark: 'Dark theme' } as const;

export default function ThemeToggle({ className }: { className?: string }) {
  const [preference, setPreference] = useState<ThemePreference>(getThemePreference);

  // Follow OS changes while the preference is "system".
  useEffect(() => {
    if (preference !== 'system') return;
    return watchSystemTheme(() => applyTheme('system'));
  }, [preference]);

  const Icon = icons[preference];
  const next = nextThemePreference(preference);

  return (
    <button
      type="button"
      onClick={() => {
        setThemePreference(next);
        setPreference(next);
      }}
      aria-label={`${labels[preference]}. Switch to ${labels[next].toLowerCase()}.`}
      title={labels[preference]}
      className={clsx('rounded-full p-2 text-current/80 transition-colors hover:bg-current/10', className)}
    >
      <Icon aria-hidden className="size-4" strokeWidth={1.5} />
    </button>
  );
}
