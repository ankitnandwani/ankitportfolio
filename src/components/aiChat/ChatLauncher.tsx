'use client';

import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useTheme } from '@/design/themeContext';
import { Button } from '@/src/components/ui/Button';

interface ChatLauncherProps extends Omit<HTMLMotionProps<'button'>, 'children' | 'onClick'> {
  onClick: () => void;
  isOpen: boolean;
  className?: string;
  'aria-label'?: string;
}

/**
 * Chat launcher button component.
 *
 * A floating action button (FAB) that opens the chat interface.
 * Uses NeoPOP button styling with Framer Motion animations.
 * Respects reduced motion preferences.
 */
export const ChatLauncher = forwardRef<HTMLButtonElement, ChatLauncherProps>(
  (
    {
      onClick,
      isOpen,
      className = '',
      'aria-label': ariaLabel = 'Ask Ankit\'s AI',
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();
    const prefersReducedMotion = React.useMemo(
      () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      []
    );

    // Determine colors based on theme
    const buttonStyle: React.CSSProperties = {
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 1000,
      width: 60,
      height: 60,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: theme === 'dark'
        ? '0 8px 20px rgba(255,255,255,0.15), 0 3px 14px rgba(255,255,255,0.12), 0 5px 5px -3px rgba(255,255,255,0.2)'
        : '0 8px 20px rgba(0,0,0,0.15), 0 3px 14px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.2)',
      backgroundColor: theme === 'dark' ? '#0D47A1' : '#0D47A1',
      color: '#FFFFFF',
      border: 'none',
      cursor: 'pointer',
      transition: prefersReducedMotion ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease',
    };

    return (
      <motion.button
        ref={ref}
        role="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-controls="chat-panel"
        onClick={onClick}
        className={className}
        style={buttonStyle}
        initial={false}
        animate={{
          scale: isOpen ? 0.95 : 1,
          rotate: isOpen ? 45 : 0,
        }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.2,
          type: prefersReducedMotion ? undefined : 'spring',
          stiffness: 260,
          damping: 20,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        {...props}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: prefersReducedMotion ? 'none' : 'transform 0.2s ease',
          }}
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </motion.button>
    );
  }
);

ChatLauncher.displayName = 'ChatLauncher';