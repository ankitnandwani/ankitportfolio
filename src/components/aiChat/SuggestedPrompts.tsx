'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SuggestedPromptsProps {
  prompts: string[];
  onPromptClick: (prompt: string) => void;
  theme: 'light' | 'dark';
}

/**
 * Suggested prompts component.
 *
 * Displays a list of example questions as clickable chips/buttons.
 * Clicking a prompt populates the input field with that question.
 * Uses staggered entrance animation.
 */
export function SuggestedPrompts({ prompts, onPromptClick, theme }: SuggestedPromptsProps) {
  const prefersReducedMotion = React.useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const containerStyle: React.CSSProperties = {
    padding: '0 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: theme === 'dark' ? '#90CAF9' : '#0D47A1',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 4,
    paddingLeft: 4,
  };

  const promptsContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };

  const promptButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    backgroundColor: theme === 'dark' ? '#2D2D2D' : '#F5F5F5',
    border: theme === 'dark' ? '1px solid #3D3D3D' : '1px solid #E0E0E0',
    borderRadius: 12,
    color: theme === 'dark' ? '#E0E0E0' : '#212121',
    textAlign: 'left',
    width: '100%',
    cursor: 'pointer',
    transition: prefersReducedMotion
      ? 'none'
      : 'background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
  };

  return (
    <div style={containerStyle} role="region" aria-label="Suggested questions">
      <div style={labelStyle}>Try asking</div>
      <div style={promptsContainerStyle}>
        {prompts.slice(0, 4).map((prompt, index) => (
          <motion.button
            key={prompt}
            onClick={() => onPromptClick(prompt)}
            style={promptButtonStyle}
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.3,
              delay: prefersReducedMotion ? 0 : index * 0.1,
              type: prefersReducedMotion ? undefined : 'spring',
              stiffness: 260,
              damping: 25,
            }}
            whileHover={{
              backgroundColor: theme === 'dark' ? '#3D3D3D' : '#EBEBEB',
              borderColor: theme === 'dark' ? '#4D4D4D' : '#D0D0D0',
              transform: prefersReducedMotion ? undefined : 'translateX(4px)',
            }}
            whileTap={{ scale: 0.98 }}
            role="button"
            tabIndex={0}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                color: theme === 'dark' ? '#90CAF9' : '#0D47A1',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <span style={{ fontSize: '0.875rem', lineHeight: 1.4 }}>{prompt}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}