'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// Define available themes as an enum
export enum ThemeName {
  LIGHT = 'light',
  DARK = 'dark',
  PRINT = 'print', // Hidden theme, only used for printing
}

// Define the user-selectable themes
export const USER_SELECTABLE_THEMES = [ThemeName.LIGHT, ThemeName.DARK];

// Define the default theme
export const DEFAULT_THEME = ThemeName.LIGHT;

type Theme = ThemeName.LIGHT | ThemeName.DARK;

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    // Check if theme is stored in localStorage
    const storedTheme = localStorage.getItem('theme') as Theme | null;

    if (storedTheme && USER_SELECTABLE_THEMES.includes(storedTheme as ThemeName)) {
      setTheme(storedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // If no stored theme but system prefers dark mode
      setTheme(ThemeName.DARK);
    }
  }, []);

  // Update data-theme attribute and localStorage when theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
