'use client';

import React, { useEffect, useState } from 'react';
import { ChatMessage } from './hooks/useChatState';

interface StreamingMessageProps {
  message: ChatMessage;
  theme: 'light' | 'dark';
}

/**
 * Streaming message component with animated cursor.
 *
 * Displays assistant messages as they stream in, with a blinking cursor
 * to indicate ongoing generation. Respects reduced motion preferences.
 */
export function StreamingMessage({ message, theme }: StreamingMessageProps) {
  const prefersReducedMotion = React.useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );
  const [showCursor, setShowCursor] = useState(!prefersReducedMotion);

  // Blinking cursor animation
  useEffect(() => {
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  const bubbleStyle: React.CSSProperties = {
    maxWidth: '85%',
    padding: '12px 16px',
    borderRadius: '20px 20px 20px 4px',
    backgroundColor: theme === 'dark' ? '#2D2D2D' : '#F5F5F5',
    color: theme === 'dark' ? '#E0E0E0' : '#212121',
    boxShadow: theme === 'dark'
      ? '0 2px 8px rgba(0,0,0,0.3)'
      : '0 2px 8px rgba(0,0,0,0.1)',
    wordWrap: 'break-word',
    alignSelf: 'flex-start',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 4,
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
  };

  const cursorStyle: React.CSSProperties = {
    display: showCursor ? 'inline-block' : 'none',
    width: '2px',
    height: '1.2em',
    backgroundColor: theme === 'dark' ? '#90CAF9' : '#0D47A1',
    animation: prefersReducedMotion ? 'none' : 'blink 1.06s infinite',
    marginLeft: 2,
    verticalAlign: 'text-bottom',
  };

  // Add keyframes for blinking cursor
  useEffect(() => {
    if (prefersReducedMotion) return;

    const styleSheet = document.styleSheets[0];
    const keyframes = `
      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
    `;

    try {
      if (styleSheet && styleSheet.cssRules.length > 0) {
        // Check if keyframes already exist
        const hasKeyframes = Array.from(styleSheet.cssRules).some(
          (rule) => rule instanceof CSSKeyframesRule && rule.name === 'blink'
        );
        if (!hasKeyframes) {
          styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
        }
      }
    } catch {
      // Ignore cross-origin stylesheet errors
    }
  }, [prefersReducedMotion]);

  /**
   * Simple markdown-like formatting for bold, italic, and inline code.
   */
  const formatContent = (content: string): React.ReactNode => {
    const parts = content.split(/(`[^`]+`)/);
    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={index}
            style={{
              backgroundColor: theme === 'dark' ? '#3D3D3D' : '#E8E8E8',
              padding: '2px 6px',
              borderRadius: 4,
              fontFamily: 'monospace',
              fontSize: '0.875em',
              color: theme === 'dark' ? '#FFAB40' : '#FF6F00',
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      const boldParts = part.split(/(\*\*[^*]+\*\*)/);
      return boldParts.map((bp, bi) => {
        if (bp.startsWith('**') && bp.endsWith('**')) {
          return <strong key={bi}>{bp.slice(2, -2)}</strong>;
        }
        const italicParts = bp.split(/(\*[^*]+\*)/);
        return italicParts.map((ip, ii) => {
          if (ip.startsWith('*') && ip.endsWith('*')) {
            return <em key={ii}>{ip.slice(1, -1)}</em>;
          }
          return ip;
        });
      });
    });
  };

  return (
    <div style={containerStyle} role="listitem" aria-label="Assistant message (streaming)" aria-busy="true">
      <div style={bubbleStyle}>
        <div style={{ lineHeight: 1.5, display: 'inline-flex', alignItems: 'flex-start' }}>
          <span>{formatContent(message.content)}</span>
          <span style={cursorStyle} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}