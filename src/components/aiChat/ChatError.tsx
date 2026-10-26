'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/src/components/ui/Button';

interface ChatErrorProps {
  message: string;
  theme: 'light' | 'dark';
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * Chat error display component.
 *
 * Shows error messages with a retry option and dismiss button.
 * Uses subtle styling that fits the NeoPOP design system.
 */
export function ChatError({ message, theme, onRetry, onDismiss }: ChatErrorProps) {
  const prefersReducedMotion = React.useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    width: '100%',
  };

  const errorStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    backgroundColor: theme === 'dark' ? '#3D1A1A' : '#FDECEC',
    border: theme === 'dark' ? '1px solid #5D2A2A' : '1px solid #F5C6C6',
    borderRadius: 12,
    color: theme === 'dark' ? '#FFAB40' : '#C62828',
    maxWidth: '100%',
    width: '100%',
  };

  const messageStyle: React.CSSProperties = {
    flex: 1,
    fontSize: '0.875rem',
    lineHeight: 1.4,
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    flexShrink: 0,
  };

  return (
    <motion.div
      style={containerStyle}
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
      role="alert"
      aria-live="assertive"
    >
      <div style={errorStyle}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span style={messageStyle}>{message}</span>
        <div style={actionsStyle}>
          {onRetry && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onRetry}
              className="px-3 py-1 text-xs"
            >
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onDismiss}
              className="px-3 py-1 text-xs"
            >
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}