'use client';

import { PropsWithChildren } from 'react';
import { useTheme } from '@/design/themeContext';

interface ResponsiveContainerProps extends PropsWithChildren {
  /**
   * If true, the container will be full-width, ignoring max-width and horizontal padding.
   */
  fullWidth?: boolean;
  /**
   * Optional className for additional styling.
   */
  className?: string;
}

export function ResponsiveContainer({ children, fullWidth = false, className = '' }: ResponsiveContainerProps) {
  const { getThemeTokens } = useTheme();
  const tokens = getThemeTokens();

  // Use spacing tokens for horizontal padding (values in pixels)
  const horizontalPadding = tokens.spacing.md; // 16px
  
  // Use xl breakpoint as max-width for readable content (1280px)
  const maxWidth = tokens.breakpoints.xl; // 1280px

  // Build className based on props
  const containerClassName = `
    mx-auto
    ${fullWidth ? 'max-w-none px-0' : `max-w-[${maxWidth}] px-[${horizontalPadding}px]`}
    ${className}
  `;

  return <div className={containerClassName}>{children}</div>;
}