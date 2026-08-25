'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { lightTheme } from './themes/light';
import { darkTheme } from './themes/dark';
import { tokens } from './tokens';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  getThemeTokens: () => typeof tokens;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    // Determine theme tokens based on current theme
    const themeTokens = theme === 'light' ? lightTheme : darkTheme;
    // Apply dark class
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Set CSS variables for background and foreground
    const rootStyle = root.style;
    const { background, text } = themeTokens.colors;
    rootStyle.setProperty('--background', background);
    rootStyle.setProperty('--foreground', text);
  }, [theme]); // Re-run effect when theme changes

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const getThemeTokens = () => (theme === 'light' ? lightTheme : darkTheme) as typeof tokens;

  return (
    <ThemeContext.Provider value={{ theme: theme, toggleTheme: toggleTheme, getThemeTokens }}>
      {children}
    </ThemeContext.Provider>
  );
};