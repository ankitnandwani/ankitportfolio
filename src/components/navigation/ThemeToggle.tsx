'use client';

import React from 'react';
import { useTheme } from '../../../design/themeContext.tsx';

interface ThemeToggleProps {
  className?: string;
}

/**
 * The moon of the theme button.
 *
 * It is the icon of `lucide-react`, drawn here as SVG so that the site has
 * one library of icons and not two. The path, the stroke, the size and the
 * colour are the ones the library used, and the class names are the ones the
 * library used as well, so that the icon looks exactly as it looked.
 *
 * The icon is a decoration: the name of the control is on the button.
 */
const Moon = ({ className = '' }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`lucide lucide-moon ${className}`}
    aria-hidden="true"
  >
    <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
  </svg>
);

/**
 * The sun of the theme button.
 *
 * It is the icon of `lucide-react`, drawn here as SVG so that the site has
 * one library of icons and not two. The path, the stroke, the size and the
 * colour are the ones the library used, and the class names are the ones the
 * library used as well, so that the icon looks exactly as it looked.
 *
 * The icon is a decoration: the name of the control is on the button.
 */
const Sun = ({ className = '' }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`lucide lucide-sun ${className}`}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

export const ThemeToggle = ({ className = '' }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className={`p-2 rounded hover:bg-muted ${className}`}
      aria-label="Toggle theme"
      onClick={toggleTheme}
    >
      {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
};
