'use client';

import React from 'react';
import { useTheme, ThemeName, USER_SELECTABLE_THEMES } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

// Map of theme icons
const THEME_ICONS = {
  [ThemeName.LIGHT]: <Sun className="h-5 w-5" />,
  [ThemeName.DARK]: <Moon className="h-5 w-5" />,
};

// Map of theme labels
const THEME_LABELS = {
  [ThemeName.LIGHT]: 'Light',
  [ThemeName.DARK]: 'Dark',
};

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  // Close dropdown after selection
  const closeDropdown = () => {
    const detailsElement = document.querySelector('details.dropdown') as HTMLDetailsElement;
    if (detailsElement) detailsElement.open = false;
  };

  return (
    <details className="dropdown dropdown-end">
      <summary className="btn btn-ghost m-1">
        {THEME_ICONS[theme]}
        <span className="hidden md:inline ml-2">Theme</span>
      </summary>
      <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-4">
        {USER_SELECTABLE_THEMES.map((themeName) => (
          <li key={themeName}>
            <a
              className={theme === themeName ? 'active' : ''}
              onClick={() => {
                setTheme(themeName as ThemeName.LIGHT | ThemeName.DARK);
                closeDropdown();
              }}
            >
              {THEME_ICONS[themeName]}
              <span>{THEME_LABELS[themeName]}</span>
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
