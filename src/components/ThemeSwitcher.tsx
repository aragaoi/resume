'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon, Coffee } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <details className="dropdown dropdown-end">
      <summary className="btn btn-ghost m-1">
        {theme === 'light' && <Sun className="h-5 w-5" />}
        {theme === 'dark' && <Moon className="h-5 w-5" />}
        {theme === 'cupcake' && <Coffee className="h-5 w-5" />}
        <span className="hidden md:inline ml-2">Theme</span>
      </summary>
      <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-4">
        <li>
          <a
            className={theme === 'light' ? 'active' : ''}
            onClick={() => {
              setTheme('light');
              const detailsElement = document.querySelector(
                'details.dropdown'
              ) as HTMLDetailsElement;
              if (detailsElement) detailsElement.open = false;
            }}
          >
            <Sun className="h-5 w-5" />
            <span>Light</span>
          </a>
        </li>
        <li>
          <a
            className={theme === 'dark' ? 'active' : ''}
            onClick={() => {
              setTheme('dark');
              const detailsElement = document.querySelector(
                'details.dropdown'
              ) as HTMLDetailsElement;
              if (detailsElement) detailsElement.open = false;
            }}
          >
            <Moon className="h-5 w-5" />
            <span>Dark</span>
          </a>
        </li>
        <li>
          <a
            className={theme === 'cupcake' ? 'active' : ''}
            onClick={() => {
              setTheme('cupcake');
              const detailsElement = document.querySelector(
                'details.dropdown'
              ) as HTMLDetailsElement;
              if (detailsElement) detailsElement.open = false;
            }}
          >
            <Coffee className="h-5 w-5" />
            <span>Cupcake</span>
          </a>
        </li>
      </ul>
    </details>
  );
}
