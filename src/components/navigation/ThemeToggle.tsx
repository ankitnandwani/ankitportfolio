'use client';

import React from 'react';
import { useTheme } from '../../../design/themeContext.tsx';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className={`p-2 rounded hover:bg-muted ${className}`}
      aria-label="Toggle theme"
      onClick={toggleTheme}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </button>
  );
};