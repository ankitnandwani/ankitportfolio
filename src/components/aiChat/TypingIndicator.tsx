'use client';

import React from 'react';

import '@/src/components/motion/motion.css';

interface TypingIndicatorProps {
  theme: 'light' | 'dark';
}

/**
 * Typing indicator component.
 *
 * Shows animated ellipsis to indicate the AI is generating a response.
 * The motion is CSS and not the library of the animation, so that the runtime
 * of the library is not in the first load of the pages that do not animate.
 * The rule of the reduced motion of PRD §131 is honoured by the CSS.
 */
export function TypingIndicator({ theme }: TypingIndicatorProps) {
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
    boxShadow:
      theme === 'dark'
        ? '0 2px 8px rgba(0,0,0,0.3)'
        : '0 2px 8px rgba(0,0,0,0.1)',
  };

  /**
   * The style of one dot.
   *
   * The delay is the one that the library used: the first dot at once, the
   * second one 0.15 s later and the third one 0.15 s after that.
   *
   * @param delay The delay of the dot, in seconds.
   * @returns The style of the dot.
   */
  const dotStyle = (delay: number): React.CSSProperties => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: theme === 'dark' ? '#90CAF9' : '#0D47A1',
    animationDelay: `${delay}s`,
  });

  return (
    <div style={containerStyle} role="status" aria-label="Assistant is typing" aria-live="polite">
      <div style={bubbleStyle}>
        <span style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#90CAF9' : '#0D47A1', fontWeight: 500 }}>
          Ask Ankit&apos;s AI
        </span>
        <span className="typing-dot" style={dotStyle(0)} />
        <span className="typing-dot" style={dotStyle(0.15)} />
        <span className="typing-dot" style={dotStyle(0.3)} />
      </div>
    </div>
  );
}