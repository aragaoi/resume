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
  // Always start with default theme to avoid hydration mismatch
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  // Track if we've mounted to avoid hydration mismatches
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference only after mounting
  useEffect(() => {
    setMounted(true);

    // Check if theme is stored in localStorage
    const storedTheme = localStorage.getItem('theme') as Theme | null;

    if (storedTheme && USER_SELECTABLE_THEMES.includes(storedTheme as ThemeName)) {
      setTheme(storedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // If no stored theme but system prefers dark mode
      setTheme(ThemeName.DARK);
    }

    // Set up media query listener for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const storedTheme = localStorage.getItem('theme') as Theme | null;
      // Only update theme automatically if user hasn't explicitly set a preference
      if (!storedTheme) {
        setTheme(e.matches ? ThemeName.DARK : ThemeName.LIGHT);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Update data-theme attribute and localStorage when theme changes, but only after component is mounted
  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme, mounted]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
