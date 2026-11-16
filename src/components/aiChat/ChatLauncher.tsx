'use client';

import React, { forwardRef } from 'react';
import { useTheme } from '@/design/themeContext';

interface ChatLauncherProps extends React.ComponentPropsWithoutRef<'button'> {
  onClick: () => void;
  isOpen: boolean;
  className?: string;
  'aria-label'?: string;
}

/**
 * Chat launcher button component.
 *
 * A floating action button (FAB) that opens the chat interface.
 * Uses NeoPOP button styling.
 *
 * The motion of the button is CSS and not the library of the animation: the
 * button is in the first load of every page of the site, and the runtime of
 * the library is 134 kB that a page that does not animate has no use for.
 * The rules of the CSS are in `app/globals.css`, and they honour the reduced
 * motion of PRD §131.
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
      boxShadow:
        theme === 'dark'
          ? '0 8px 20px rgba(255,255,255,0.15), 0 3px 14px rgba(255,255,255,0.12), 0 5px 5px -3px rgba(255,255,255,0.2)'
          : '0 8px 20px rgba(0,0,0,0.15), 0 3px 14px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.2)',
      backgroundColor: theme === 'dark' ? '#0D47A1' : '#0D47A1',
      color: '#FFFFFF',
      border: 'none',
      cursor: 'pointer',
    };

    return (
      <button
        ref={ref}
        type="button"
        role="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-controls="chat-panel"
        data-state={isOpen ? 'open' : 'closed'}
        onClick={onClick}
        className={`chat-launcher ${className}`}
        style={buttonStyle}
        {...props}
      >
        <svg
          className="chat-launcher-icon"
          data-state={isOpen ? 'open' : 'closed'}
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }
);

ChatLauncher.displayName = 'ChatLauncher';
