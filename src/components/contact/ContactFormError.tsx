'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/src/components/ui/Button';

interface ContactFormErrorProps {
  theme: 'light' | 'dark';
  errorType: 'validation' | 'rate_limit' | 'server' | 'network';
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  isSubmitting?: boolean;
}

/**
 * Contact form error state component.
 *
 * Shows error messages with retry and dismiss options.
 * The heading and styling adapt based on the error type.
 * Respects reduced motion preferences.
 */
export function ContactFormError({
  theme,
  errorType,
  message,
  onRetry,
  onDismiss,
  isSubmitting = false,
}: ContactFormErrorProps) {
  const prefersReducedMotion = React.useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    padding: '24px 16px',
    textAlign: 'center',
    width: '100%',
  };

  const iconStyle: React.CSSProperties = {
    width: 64,
    height: 64,
    color: theme === 'dark' ? '#EF5350' : '#C62828',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: theme === 'dark' ? '#E0E0E0' : '#212121',
    margin: 0,
  };

  const messageStyle: React.CSSProperties = {
    fontSize: '1rem',
    lineHeight: 1.6,
    color: theme === 'dark' ? '#B0B0B0' : '#616161',
    maxWidth: 400,
    margin: 0,
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
  };

  // Error type specific heading
  let heading = 'Something Went Wrong';
  switch (errorType) {
    case 'validation':
      heading = 'Please Fix the Errors Above';
      break;
    case 'rate_limit':
      heading = 'Too Many Requests';
      break;
    case 'network':
      heading = 'Connection Failed';
      break;
    case 'server':
    default:
      heading = 'Something Went Wrong';
      break;
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
      role="alert"
      aria-live="assertive"
      style={containerStyle}
    >
      <svg
        style={iconStyle}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <h3 style={titleStyle}>{heading}</h3>
      <p style={messageStyle}>{message}</p>
      <div style={buttonGroupStyle}>
        {onRetry && (
          <Button variant="primary" size="md" onClick={onRetry} disabled={isSubmitting}>
            Retry
          </Button>
        )}
        {onDismiss && (
          <Button variant="secondary" size="md" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Determines the error type from the error message or status code.
 */
export function getErrorType(error: string | unknown, statusCode?: number): 'validation' | 'rate_limit' | 'server' | 'network' {
  if (typeof error === 'string') {
    const lowerError = error.toLowerCase();
    if (lowerError.includes('rate limit') || lowerError.includes('too many') || lowerError.includes('429') || statusCode === 429) {
      return 'rate_limit';
    }
    if (lowerError.includes('network') || lowerError.includes('connection') || lowerError.includes('fetch') || statusCode === 0) {
      return 'network';
    }
    if (lowerError.includes('validation') || lowerError.includes('fix the errors') || statusCode === 400) {
      return 'validation';
    }
  }
  if (statusCode === 429) return 'rate_limit';
  if (statusCode === 400) return 'validation';
  if (statusCode === 0) return 'network';
  if (statusCode && statusCode >= 500) return 'server';
  return 'server';
}