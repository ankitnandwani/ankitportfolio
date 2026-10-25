'use client';

import React, { useRef, useCallback, useState } from 'react';
import { useTheme } from '@/design/themeContext';
import { Button } from '@/src/components/ui/Button';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  theme: 'light' | 'dark';
  placeholder?: string;
}

/**
 * Chat input component.
 *
 * Text area with send button that handles Enter to send,
 * Shift+Enter for new line, and auto-resize functionality.
 * Includes character count and accessibility features.
 */
export function ChatInput({
  onSendMessage,
  isLoading,
  theme,
  placeholder = 'Ask about Ankit\'s experience, projects, or skills...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState('');
  const [height, setHeight] = useState(48);
  const prefersReducedMotion = React.useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const maxChars = 2000;
  const charCount = value.length;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 12,
    width: '100%',
  };

  const textareaWrapperStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  };

  const textareaStyle: React.CSSProperties = {
    minHeight: 48,
    maxHeight: 160,
    height,
    padding: '12px 16px',
    backgroundColor: theme === 'dark' ? '#2D2D2D' : '#F5F5F5',
    border: theme === 'dark' ? '1px solid #3D3D3D' : '1px solid #E0E0E0',
    borderRadius: 16,
    color: theme === 'dark' ? '#E0E0E0' : '#212121',
    fontSize: '0.875rem',
    lineHeight: 1.5,
    fontFamily: 'inherit',
    resize: 'none',
    outline: 'none',
    transition: prefersReducedMotion
      ? 'none'
      : 'border-color 0.2s ease, box-shadow 0.2s ease, height 0.1s ease',
    boxShadow: 'none',
  };

  const charCountStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    color: theme === 'dark' ? '#757575' : '#9E9E9E',
    textAlign: 'right',
    paddingRight: 4,
  };

  const sendButtonStyle: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme === 'dark' ? '#0D47A1' : '#0D47A1',
    color: '#FFFFFF',
    border: 'none',
    cursor: isLoading || !value.trim() ? 'not-allowed' : 'pointer',
    opacity: isLoading || !value.trim() ? 0.5 : 1,
    transition: prefersReducedMotion
      ? 'none'
      : 'background-color 0.2s ease, transform 0.2s ease, opacity 0.2s ease',
    flexShrink: 0,
  };

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 160);
      setHeight(newHeight);
    }
  }, []);

  React.useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      if (newValue.length <= maxChars) {
        setValue(newValue);
      }
    },
    []
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (value.trim() && !isLoading) {
          onSendMessage(value.trim());
          setValue('');
        }
      }
    },
    [value, isLoading, onSendMessage]
  );

  const handleSendClick = useCallback(() => {
    if (value.trim() && !isLoading) {
      onSendMessage(value.trim());
      setValue('');
    }
  }, [value, isLoading, onSendMessage]);

  return (
    <div style={containerStyle} role="form" aria-label="Chat input">
      <div style={textareaWrapperStyle}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onClick={adjustHeight}
          placeholder={placeholder}
          disabled={isLoading}
          style={textareaStyle}
          aria-label="Chat message input"
          aria-describedby="char-count"
          rows={1}
          spellCheck={false}
        />
        <div id="char-count" style={charCountStyle} aria-live="polite">
          {charCount}/{maxChars}
        </div>
      </div>
      <button
        onClick={handleSendClick}
        disabled={isLoading || !value.trim()}
        style={sendButtonStyle}
        aria-label="Send message"
        aria-disabled={isLoading || !value.trim()}
        title="Send message"
        type="button"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
}