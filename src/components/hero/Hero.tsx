'use client';

import React from 'react';
import { useTheme } from '@/design/themeContext';

interface HeroProps {
  /**
   * Optional className for customization
   */
  className?: string;
}

export const Hero = ({ className = '' }: HeroProps) => {
  const { getThemeTokens } = useTheme();
  const tokens = getThemeTokens();

  // Get text color from tokens (adapts to light/dark mode)
  const textColor = tokens.colors.text;

  return (
    <div className={className}>
      <h1 
        style={{ color: textColor }}
        className="text-5xl font-black leading-tight tracking-tighter mb-lg"
      >
        ANKIT NANDWANI
      </h1>
      <h2 
        style={{ color: textColor }}
        className="text-lg font-semibold mb-md"
      >
        Senior SDET / Automation Engineer
      </h2>
      <div className="space-y-sm mb-lg">
        <p 
          style={{ color: textColor }}
          className="text-base font-medium"
        >
          Quality Engineering.
        </p>
        <p 
          style={{ color: textColor }}
          className="text-base font-medium"
        >
          Backend Automation.
        </p>
        <p 
          style={{ color: textColor }}
          className="text-base font-medium"
        >
          Cloud.
        </p>
        <p 
          style={{ color: textColor }}
          className="text-base font-medium"
        >
          AI.
        </p>
      </div>
      <p 
        style={{ color: textColor }}
        className="text-base font-normal"
      >
        Building reliable software and engineering systems across complex technology stacks.
      </p>
    </div>
  );
}
