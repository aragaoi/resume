'use client';

import React from 'react';
import { useTheme, ThemeName } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

interface ThemeSwitcherProps {
  className?: string;
}

export function ThemeSwitcher({ className = '' }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();

  const isDarkMode = theme === ThemeName.DARK;

  const toggleTheme = () => {
    const newTheme = isDarkMode ? ThemeName.LIGHT : ThemeName.DARK;
    setTheme(newTheme);
  };

  return (
    <div
      className={`tooltip tooltip-bottom ${className}`}
      data-tip={`Switch to ${isDarkMode ? 'light' : 'dark'} theme`}
    >
      <button
        type="button"
        onClick={toggleTheme}
        className="btn btn-ghost btn-circle"
        aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} theme`}
      >
        {isDarkMode ? (
          <Sun className="h-5 w-5 text-yellow-400" />
        ) : (
          <Moon className="h-5 w-5 text-slate-400" />
        )}
      </button>
    </div>
  );
}
