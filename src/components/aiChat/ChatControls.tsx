'use client';

import React from 'react';
import { useTheme } from '@/design/themeContext';
import { Button } from '@/src/components/ui/Button';

interface ChatControlsProps {
  onClose: () => void;
  onMinimize: () => void;
  onClearChat: () => void;
  isLoading: boolean;
  theme: 'light' | 'dark';
}

/**
 * Chat controls component.
 *
 * Provides buttons for clearing the chat, minimizing, and closing the panel.
 * Includes tooltips and proper ARIA labels for accessibility.
 */
export function ChatControls({
  onClose,
  onMinimize,
  onClearChat,
  isLoading,
  theme,
}: ChatControlsProps) {
  const prefersReducedMotion = React.useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: theme === 'dark' ? '#E0E0E0' : '#212121',
    transition: prefersReducedMotion
      ? 'none'
      : 'background-color 0.2s ease, color 0.2s ease',
  };

  const buttonHoverStyle: React.CSSProperties = {
    backgroundColor: theme === 'dark' ? '#3D3D3D' : '#F0F0F0',
  };

  return (
    <div style={{ display: 'flex', gap: 4 }} role="group" aria-label="Chat controls">
      <button
        onClick={onClearChat}
        disabled={isLoading}
        style={{
          ...buttonStyle,
          opacity: isLoading ? 0.5 : 1,
          cursor: isLoading ? 'not-allowed' : 'pointer',
        }}
        aria-label="Clear conversation"
        aria-disabled={isLoading}
        title="Clear conversation"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 6h18" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>

      <button
        onClick={onMinimize}
        style={buttonStyle}
        aria-label="Minimize chat"
        title="Minimize"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <button
        onClick={onClose}
        style={buttonStyle}
        aria-label="Close chat"
        title="Close"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}