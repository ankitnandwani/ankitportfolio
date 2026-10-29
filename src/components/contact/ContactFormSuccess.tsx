'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/src/components/ui/Button';

interface ContactFormSuccessProps {
  theme: 'light' | 'dark';
  onSendAnother?: () => void;
}

/**
 * Contact form success state component.
 *
 * Shows a success confirmation with a checkmark icon and an option
 * to send another message. Respects reduced motion preferences.
 */
export function ContactFormSuccess({ theme, onSendAnother }: ContactFormSuccessProps) {
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
    color: theme === 'dark' ? '#66BB6A' : '#43A047',
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

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? {} : { opacity: 0, y: -20 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
      style={containerStyle}
      role="status"
      aria-live="polite"
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
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      <h3 style={titleStyle}>Message Sent!</h3>
      <p style={messageStyle}>
        Thanks for reaching out! I&apos;ll get back to you as soon as possible.
      </p>
      {onSendAnother && (
        <div style={buttonGroupStyle}>
          <Button variant="primary" size="md" onClick={onSendAnother}>
            Send Another Message
          </Button>
        </div>
      )}
    </motion.div>
  );
}