import { MoonStar, Sun } from 'lucide-react';

import { useTheme } from '@hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-soft hover:bg-gray-50 focus-ring"
      aria-label="Toggle theme"
    >
      {isDark ? <MoonStar className="h-4 w-4 text-primary-500" /> : <Sun className="h-4 w-4 text-primary-500" />}
      <span>{isDark ? 'Dark mode' : 'Light mode'}</span>
    </button>
  );
}

export default ThemeToggle;
