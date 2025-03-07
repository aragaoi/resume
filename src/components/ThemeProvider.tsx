import React, { useEffect } from 'react';
import { ThemeConfig, defaultTheme } from '../styles/theme';

interface ThemeProviderProps {
  theme?: Partial<ThemeConfig>;
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ theme, children }) => {
  useEffect(() => {
    const mergedTheme = {
      ...defaultTheme,
      ...theme,
      colors: {
        ...defaultTheme.colors,
        ...theme?.colors,
      },
      typography: {
        ...defaultTheme.typography,
        ...theme?.typography,
      },
      spacing: {
        ...defaultTheme.spacing,
        ...theme?.spacing,
      },
      borderRadius: {
        ...defaultTheme.borderRadius,
        ...theme?.borderRadius,
      },
    };

    const root = document.documentElement;

    // Colors
    Object.entries(mergedTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Typography
    Object.entries(mergedTheme.typography).forEach(([key, value]) => {
      root.style.setProperty(`--${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`, value);
    });

    // Spacing
    Object.entries(mergedTheme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--space-${key}`, value);
    });

    // Border Radius
    Object.entries(mergedTheme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });
  }, [theme]);

  return <>{children}</>;
};
