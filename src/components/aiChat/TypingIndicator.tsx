'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/design/themeContext';

interface TypingIndicatorProps {
  theme: 'light' | 'dark';
}

/**
 * Typing indicator component.
 *
 * Shows animated ellipsis to indicate the AI is generating a response.
 * Respects reduced motion preferences.
 */
export function TypingIndicator({ theme }: TypingIndicatorProps) {
  const prefersReducedMotion = React.useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    alignSelf: 'flex-start',
  };

  const bubbleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '12px 16px',
    backgroundColor: theme === 'dark' ? '#2D2D2D' : '#F5F5F5',
    borderRadius: '20px 20px 20px 4px',
    boxShadow: theme === 'dark'
      ? '0 2px 8px rgba(0,0,0,0.3)'
      : '0 2px 8px rgba(0,0,0,0.1)',
  };

  const dotStyle: React.CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: theme === 'dark' ? '#90CAF9' : '#0D47A1',
  };

  return (
    <div style={containerStyle} role="status" aria-label="Assistant is typing" aria-live="polite">
      <div style={bubbleStyle}>
        <span style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#90CAF9' : '#0D47A1', fontWeight: 500 }}>
          Ask Ankit&apos;s AI
        </span>
        <motion.span
          style={dotStyle}
          animate={prefersReducedMotion ? {} : { scale: [1, 1.3, 1] }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.6,
            repeat: Infinity,
            delay: 0,
          }}
        />
        <motion.span
          style={dotStyle}
          animate={prefersReducedMotion ? {} : { scale: [1, 1.3, 1] }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.6,
            repeat: Infinity,
            delay: 0.15,
          }}
        />
        <motion.span
          style={dotStyle}
          animate={prefersReducedMotion ? {} : { scale: [1, 1.3, 1] }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.6,
            repeat: Infinity,
            delay: 0.3,
          }}
        />
      </div>
    </div>
  );
}