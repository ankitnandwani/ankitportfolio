'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/design/themeContext';
import type { ChatMessage } from './hooks/useChatState';
import { ChatMessageComponent } from './ChatMessage';
import { StreamingMessage } from './StreamingMessage';
import { SuggestedPrompts } from './SuggestedPrompts';
import { TypingIndicator } from './TypingIndicator';
import { ChatError } from './ChatError';
import { ChatControls } from './ChatControls';
import { ChatInput } from './ChatInput';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  messages: ChatMessage[];
  streamingState: 'idle' | 'streaming' | 'complete' | 'error';
  error: string | null;
  isLoading: boolean;
  suggestedPrompts: string[];
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
  onPromptClick: (prompt: string) => void;
  onRetry?: () => void;
  onDismissError?: () => void;
  className?: string;
}

/**
 * Main chat panel component.
 *
 * Renders as a floating panel on desktop and a full-screen modal on mobile.
 * Includes header, message list, suggested prompts, typing indicator,
 * error display, input area, and controls.
 * Manages focus trap for accessibility when open.
 */
export function ChatPanel({
  isOpen,
  onClose,
  onMinimize,
  messages,
  streamingState,
  error,
  isLoading,
  suggestedPrompts,
  onSendMessage,
  onClearChat,
  onPromptClick,
  onRetry,
  onDismissError,
  className = '',
}: ChatPanelProps) {
  const { theme } = useTheme();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = React.useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const isMobile = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  }, []);

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      // Focus the panel for keyboard navigation
      setTimeout(() => {
        panelRef.current?.focus();
      }, 0);
    } else if (previousActiveElement.current) {
      previousActiveElement.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard events - Escape to close, Tab for focus trap
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isOpen) return;
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusableElements = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    },
    [isOpen, onClose]
  );

  if (!isOpen) return null;

  const panelStyle: React.CSSProperties = {
    position: isMobile ? 'fixed' : 'fixed',
    bottom: isMobile ? 0 : 100,
    right: isMobile ? 0 : 24,
    width: isMobile ? '100%' : 400,
    height: isMobile ? '100%' : 600,
    maxHeight: isMobile ? '100%' : 600,
    borderRadius: isMobile ? '24px 24px 0 0' : 24,
    backgroundColor: theme === 'dark' ? '#1E1E1E' : '#FFFFFF',
    boxShadow: theme === 'dark'
      ? '0 -8px 30px rgba(0,0,0,0.3), 0 -4px 20px rgba(0,0,0,0.2)'
      : '0 -8px 30px rgba(0,0,0,0.15), 0 -4px 20px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 1001,
    border: theme === 'dark' ? '1px solid #333' : '1px solid #E0E0E0',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    display: isMobile ? 'block' : 'none',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: theme === 'dark' ? '1px solid #333' : '1px solid #E0E0E0',
    backgroundColor: theme === 'dark' ? '#1E1E1E' : '#FFFFFF',
    flexShrink: 0,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: theme === 'dark' ? '#E0E0E0' : '#212121',
    margin: 0,
  };

  const controlsStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
  };

  const messagesContainerStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  };

  const inputContainerStyle: React.CSSProperties = {
    padding: 16,
    borderTop: theme === 'dark' ? '1px solid #333' : '1px solid #E0E0E0',
    backgroundColor: theme === 'dark' ? '#1E1E1E' : '#FFFFFF',
    flexShrink: 0,
  };

  return (
    <AnimatePresence>
      {isMobile && (
        <motion.div
          style={overlayStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-label="Ask Ankit's AI"
        aria-modal={isMobile}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        style={panelStyle}
        className={className}
        initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
        animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
        exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.3,
          type: prefersReducedMotion ? undefined : 'spring',
          stiffness: 260,
          damping: 25,
        }}
      >
        <header style={headerStyle}>
          <h2 style={titleStyle}>Ask Ankit&apos;s AI</h2>
          <div style={controlsStyle}>
            <ChatControls
              onClose={onClose}
              onMinimize={onMinimize}
              onClearChat={onClearChat}
              isLoading={isLoading}
              theme={theme}
            />
          </div>
        </header>

        <div style={messagesContainerStyle} role="log" aria-live="polite" aria-label="Conversation">
          <AnimatePresence mode="popLayout">
            {messages.map((message) =>
              message.isStreaming ? (
                <StreamingMessage
                  key={message.id}
                  message={message}
                  theme={theme}
                />
              ) : (
                <ChatMessageComponent
                  key={message.id}
                  message={message}
                  theme={theme}
                />
              )
            )}
          </AnimatePresence>

          {streamingState === 'streaming' && (
            <TypingIndicator theme={theme} />
          )}

          {error && (
            <ChatError
              message={error}
              theme={theme}
              onRetry={onRetry}
              onDismiss={onDismissError}
            />
          )}
        </div>

        {messages.length === 0 && streamingState === 'idle' && (
          <SuggestedPrompts
            prompts={suggestedPrompts}
            onPromptClick={onPromptClick}
            theme={theme}
          />
        )}

        <div style={inputContainerStyle}>
          <ChatInput
            onSendMessage={onSendMessage}
            isLoading={isLoading || streamingState === 'streaming'}
            theme={theme}
            placeholder="Ask about Ankit's experience, projects, or skills..."
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}