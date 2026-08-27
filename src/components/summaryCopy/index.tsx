'use client';

import React from 'react';
import { useTheme } from '@/design/themeContext';

interface SummaryCopyProps {
  /**
   * The summary text to display
   */
  summary: string;
  /**
   * Optional className for customization
   */
  className?: string;
}

export const SummaryCopy = ({ summary, className = '' }: SummaryCopyProps) => {
  const { getThemeTokens } = useTheme();
  const tokens = getThemeTokens();

  // Get text color from tokens (adapts to light/dark mode)
  const textColor = tokens.colors.text;

  return (
    <section className={`${className} w-full py-8`}>
      <div className="max-w-[1200px] mx-auto px-4">
        <p 
          style={{ color: textColor }}
          className="text-base md:text-lg font-medium leading-loose text-center"
        >
          {summary}
        </p>
      </div>
    </section>
  );
};